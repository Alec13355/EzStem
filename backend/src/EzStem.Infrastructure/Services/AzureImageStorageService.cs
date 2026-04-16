using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using EzStem.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace EzStem.Infrastructure.Services;

public class AzureImageStorageService : IImageStorageService
{
    private readonly BlobContainerClient _container;
    private const string ContainerName = "item-images";

    public AzureImageStorageService(IConfiguration config)
    {
        var connStr = config["AzureBlobStorage:ConnectionString"]
            ?? throw new InvalidOperationException("AzureBlobStorage:ConnectionString not configured");
        var serviceClient = new BlobServiceClient(connStr);
        _container = serviceClient.GetBlobContainerClient(ContainerName);
    }

    public async Task<string> UploadImageAsync(Stream imageStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        await _container.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);
        var blobName = $"{Guid.NewGuid()}/{fileName}";
        var blobClient = _container.GetBlobClient(blobName);
        await blobClient.UploadAsync(imageStream, new BlobHttpHeaders { ContentType = contentType }, cancellationToken: cancellationToken);
        return blobClient.Uri.ToString();
    }
}
