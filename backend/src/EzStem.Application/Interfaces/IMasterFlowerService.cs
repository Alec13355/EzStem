using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IMasterFlowerService
{
    Task<IEnumerable<MasterFlowerResponse>> GetAllAsync(string ownerId, string? category = null, CancellationToken ct = default);
    Task<IEnumerable<string>> GetCategoriesAsync(string ownerId, CancellationToken ct = default);
    Task<MasterFlowerResponse?> GetByIdAsync(Guid id, string ownerId, CancellationToken ct = default);
    Task<MasterFlowerResponse> CreateAsync(CreateMasterFlowerRequest request, string ownerId, CancellationToken ct = default);
    Task<MasterFlowerResponse?> UpdateAsync(Guid id, UpdateMasterFlowerRequest request, string ownerId, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, string ownerId, CancellationToken ct = default);  // soft delete (IsActive=false)
    Task<OcrImportResult> ImportFromPdfAsync(Stream pdfStream, string ownerId, IOcrService ocrService, CancellationToken ct = default);
}
