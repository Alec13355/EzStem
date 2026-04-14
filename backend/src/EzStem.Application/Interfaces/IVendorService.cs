using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IVendorService
{
    Task<PagedResponse<VendorResponse>> GetVendorsAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task<VendorResponse?> GetVendorByIdAsync(Guid id, CancellationToken ct = default);
    Task<VendorResponse> CreateVendorAsync(CreateVendorRequest request, CancellationToken ct = default);
    Task<VendorResponse?> UpdateVendorAsync(Guid id, UpdateVendorRequest request, CancellationToken ct = default);
    Task<bool> DeleteVendorAsync(Guid id, CancellationToken ct = default);
}
