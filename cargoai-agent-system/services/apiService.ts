import { Load, MatchScore, LoadStatus } from '../types';

// Backend API base URL - update this to match your backend URL
const API_BASE_URL = 'http://localhost:3000';

// Backend response types
interface BackendBrokerPost {
  id: string;
  origin: string;
  destination: string;
  tripMiles: number;
  totalMiles: number;
  rate: number;
  company: string;
  phone?: string;
  email?: string;
  truck?: string;
  commodity?: string;
  brokerName?: string;
  brokerRating?: number;
  createdAt: string;
}

interface BackendFilteredResult {
  id: string;
  dispatcherId: string;
  brokerPostId: string;
  score: 'green' | 'yellow' | 'red';
  matchScore: number;
  rejectionReason?: string;
  filterDetails?: Record<string, any>;
  isNotified: boolean;
  createdAt: string;
  brokerPost: BackendBrokerPost;
}

// Map backend score to frontend MatchScore
function mapScore(backendScore: string): MatchScore {
  switch (backendScore.toLowerCase()) {
    case 'green':
      return MatchScore.GREEN;
    case 'yellow':
      return MatchScore.YELLOW;
    case 'red':
      return MatchScore.RED;
    default:
      return MatchScore.RED;
  }
}

// Map backend response to frontend Load format
function mapToLoad(result: BackendFilteredResult, dispatcherConfig?: { minPricePerMile?: number }): Load {
  const post = result.brokerPost;
  const distance = post.tripMiles || post.totalMiles || 0;
  const price = post.rate || 0;
  
  // Calculate target price (10% above offered price) and min price
  const targetPrice = Math.round(price * 1.1);
  const minPricePerMile = dispatcherConfig?.minPricePerMile || 2.0;
  const minPrice = Math.round(distance * minPricePerMile);

  return {
    id: result.id,
    origin: post.origin || 'Unknown',
    destination: post.destination || 'Unknown',
    pickupDate: new Date(post.createdAt).toISOString().split('T')[0], // Use created date as pickup date fallback
    equipment: post.truck || 'Unknown',
    weight: 0, // Not available in backend response
    price: price,
    distance: distance,
    brokerName: post.company || post.brokerName || 'Unknown',
    brokerRating: post.brokerRating || 0,
    score: mapScore(result.score),
    status: LoadStatus.PENDING,
    targetPrice: targetPrice,
    minPrice: minPrice,
    notes: result.rejectionReason,
  };
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get top N loads for a dispatcher
   * @param dispatcherId - UUID of the dispatcher
   * @param limit - Number of loads to return (default: 5)
   */
  async getTopLoads(dispatcherId: string, limit: number = 5): Promise<Load[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/loads/top?dispatcherId=${dispatcherId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch top loads: ${response.statusText}`);
      }

      const data: BackendFilteredResult[] = await response.json();
      return data.map(result => mapToLoad(result));
    } catch (error) {
      console.error('Error fetching top loads:', error);
      throw error;
    }
  }

  /**
   * Get all filtered loads for a dispatcher
   * @param dispatcherId - UUID of the dispatcher
   * @param score - Optional filter by score (green, yellow, red)
   */
  async getAllLoads(dispatcherId: string, score?: 'green' | 'yellow' | 'red'): Promise<Load[]> {
    try {
      let url = `${this.baseUrl}/loads/filtered?dispatcherId=${dispatcherId}`;
      if (score) {
        url += `&score=${score}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch loads: ${response.statusText}`);
      }

      const data: BackendFilteredResult[] = await response.json();
      
      // Get dispatcher config for min price calculation
      const config = await this.getDispatcherConfig(dispatcherId).catch(() => null);
      
      return data.map(result => mapToLoad(result, config));
    } catch (error) {
      console.error('Error fetching all loads:', error);
      throw error;
    }
  }

  /**
   * Get dispatcher configuration
   * @param dispatcherId - UUID of the dispatcher
   */
  async getDispatcherConfig(dispatcherId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/dispatcher/${dispatcherId}/config`);

      if (!response.ok) {
        throw new Error(`Failed to fetch dispatcher config: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dispatcher config:', error);
      throw error;
    }
  }

  /**
   * Get dispatcher by ID
   * @param dispatcherId - UUID of the dispatcher
   */
  async getDispatcher(dispatcherId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/dispatcher/${dispatcherId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch dispatcher: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dispatcher:', error);
      throw error;
    }
  }

  /**
   * Update dispatcher configuration
   * @param dispatcherId - UUID of the dispatcher
   * @param config - Configuration object to update
   */
  async updateDispatcherConfig(dispatcherId: string, config: any): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/dispatcher/${dispatcherId}/config`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update dispatcher config: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating dispatcher config:', error);
      throw error;
    }
  }

  /**
   * Submit a new broker post for filtering
   * @param dispatcherId - UUID of the dispatcher
   * @param post - Broker post data
   */
  async submitBrokerPost(dispatcherId: string, post: any): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/broker-post?dispatcherId=${dispatcherId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(post),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to submit broker post: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting broker post:', error);
      throw error;
    }
  }

  /**
   * Import broker posts from JSON file/data
   * @param posts - Array of broker posts to import
   * @param dispatcherId - Optional UUID of the dispatcher (will auto-create if not provided)
   */
  async importPosts(posts: any[], dispatcherId?: string): Promise<{
    message: string;
    dispatcherId: string;
    dispatcher?: {
      id: string;
      email: string;
      name: string;
    };
    imported: number;
    failed: number;
    errors?: any[];
  }> {
    try {
      let url = `${this.baseUrl}/import/json`;
      if (dispatcherId) {
        url += `?dispatcherId=${dispatcherId}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(posts),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to import posts: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error importing posts:', error);
      throw error;
    }
  }

  // ==================== OFFER ENDPOINTS ====================

  /**
   * Create and send an offer to a broker
   * @param dispatcherId - UUID of the dispatcher
   * @param brokerPostId - UUID of the broker post
   * @param initialPrice - Initial offer price
   */
  async sendOffer(dispatcherId: string, brokerPostId: string, initialPrice: number): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/offer/send?dispatcherId=${dispatcherId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ brokerPostId, initialPrice }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send offer: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending offer:', error);
      throw error;
    }
  }

  /**
   * Approve a pending offer
   * @param offerId - UUID of the offer
   */
  async approveOffer(offerId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/offer/approve/${offerId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to approve offer: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error approving offer:', error);
      throw error;
    }
  }

  /**
   * Reject an offer
   * @param offerId - UUID of the offer
   */
  async rejectOffer(offerId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/offer/reject/${offerId}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`Failed to reject offer: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      throw error;
    }
  }

  /**
   * Get offers for a dispatcher
   * @param dispatcherId - UUID of the dispatcher
   * @param status - Optional filter by status
   */
  async getOffers(dispatcherId: string, status?: 'pending_approval' | 'sent' | 'rejected' | 'accepted'): Promise<any[]> {
    try {
      let url = `${this.baseUrl}/offer?dispatcherId=${dispatcherId}`;
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch offers: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }
  }

  // ==================== NEGOTIATION ENDPOINTS ====================

  /**
   * Start a new negotiation session
   * @param dispatcherId - UUID of the dispatcher
   * @param offerId - UUID of the offer
   */
  async startNegotiation(dispatcherId: string, offerId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/negotiation/start?dispatcherId=${dispatcherId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ offerId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to start negotiation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting negotiation:', error);
      throw error;
    }
  }

  /**
   * Process broker response in negotiation
   * @param sessionId - UUID of the negotiation session
   * @param message - Broker message
   */
  async processNegotiation(sessionId: string, message: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/negotiation/process/${sessionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to process negotiation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing negotiation:', error);
      throw error;
    }
  }

  /**
   * Get negotiation session status
   * @param sessionId - UUID of the negotiation session
   */
  async getNegotiationStatus(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/negotiation/status/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch negotiation status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching negotiation status:', error);
      throw error;
    }
  }

  /**
   * End a negotiation session
   * @param sessionId - UUID of the negotiation session
   */
  async endNegotiation(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/negotiation/end/${sessionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to end negotiation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error ending negotiation:', error);
      throw error;
    }
  }

  // ==================== DECISION ENDPOINTS ====================

  /**
   * Evaluate negotiation and get recommendation
   * @param sessionId - UUID of the negotiation session
   */
  async evaluateNegotiation(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/decision/evaluate/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to evaluate negotiation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error evaluating negotiation:', error);
      throw error;
    }
  }

  /**
   * Handle broker rejection
   * @param sessionId - UUID of the negotiation session
   * @param reason - Rejection reason
   */
  async rejectNegotiation(sessionId: string, reason?: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/decision/reject/${sessionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to reject negotiation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error rejecting negotiation:', error);
      throw error;
    }
  }

  /**
   * Request human call for negotiation
   * @param sessionId - UUID of the negotiation session
   */
  async requestHumanCall(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/decision/human-call/${sessionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to request human call: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting human call:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION ENDPOINTS ====================

  /**
   * Trigger notification for dispatcher
   * @param dispatcherId - UUID of the dispatcher
   */
  async triggerNotification(dispatcherId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/notify/dispatcher/${dispatcherId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger notification: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error triggering notification:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();

