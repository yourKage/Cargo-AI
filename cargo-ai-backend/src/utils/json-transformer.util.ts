/**
 * Transforms JSON data from external format to internal DTO format
 * Handles field name mapping and type conversion
 */
export function transformBrokerPostJson(jsonData: any): any {
  return {
    no: jsonData.No ?? jsonData.no,
    origin: jsonData.Origin ?? jsonData.origin,
    destination: jsonData.Destination ?? jsonData.destination,
    tripMiles: jsonData.Trip_Miles ?? jsonData.tripMiles ?? jsonData.TripMiles,
    totalMiles: jsonData.Total_Miles ?? jsonData.totalMiles ?? jsonData.TotalMiles,
    rate: jsonData.Rate ?? jsonData.rate,
    company: jsonData.Company ?? jsonData.company,
    phone: jsonData.Phone ?? jsonData.phone,
    email: jsonData.Email ?? jsonData.email,
    truck: jsonData.Truck ?? jsonData.truck,
    commodity: jsonData.Commodity ?? jsonData.commodity,
    referenceId: jsonData.Reference_ID ?? jsonData.referenceId ?? jsonData.ReferenceId,
    mcNumber: jsonData.MC_Number ?? jsonData.mcNumber ?? jsonData.MCNumber,
    dhO: jsonData['DH-O'] ?? jsonData.dhO ?? jsonData.DHO,
    dhD: jsonData['DH-D'] ?? jsonData.dhD ?? jsonData.DHD,
    // Legacy fields
    brokerId: jsonData.brokerId,
    brokerName: jsonData.brokerName,
    brokerRating: jsonData.brokerRating,
    originLatitude: jsonData.originLatitude,
    originLongitude: jsonData.originLongitude,
    destinationLatitude: jsonData.destinationLatitude,
    destinationLongitude: jsonData.destinationLongitude,
  };
}

