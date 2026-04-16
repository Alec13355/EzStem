namespace EzStem.Application.Interfaces;

public interface IImageStorageService
{
    Task<string> UploadImageAsync(Stream imageStream, string fileName, string contentType, CancellationToken cancellationToken = default);
}
