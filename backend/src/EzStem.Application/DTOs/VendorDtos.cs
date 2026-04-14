namespace EzStem.Application.DTOs;

public record CreateVendorRequest(string Name, string? ContactEmail, string? Notes);
public record UpdateVendorRequest(string? Name, string? ContactEmail, string? Notes);
public record VendorResponse(Guid Id, string Name, string? ContactEmail, string? Notes);
