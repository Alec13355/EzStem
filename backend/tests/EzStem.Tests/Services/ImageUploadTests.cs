using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.API.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EzStem.Tests.Services;

public class ImageUploadTests
{
    private static IFormFile MakeFormFile(string contentType, long length, string fileName = "test.jpg")
    {
        var ms = new MemoryStream(new byte[length]);
        var file = new FormFile(ms, 0, length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
        return file;
    }

    private static ItemsController BuildController(IImageStorageService imageService)
    {
        var itemService = new FakeItemService();
        var controller = new ItemsController(itemService, imageService);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }

    [Fact]
    public async Task UploadImage_InvalidContentType_Returns400()
    {
        var imageService = new FakeImageStorageService("https://example.com/img.gif");
        var controller = BuildController(imageService);
        var file = MakeFormFile("image/gif", 100, "test.gif");

        var result = await controller.UploadImage(file, CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("JPG, PNG", badRequest.Value?.ToString());
    }

    [Fact]
    public async Task UploadImage_OversizedFile_Returns400()
    {
        var imageService = new FakeImageStorageService("https://example.com/img.jpg");
        var controller = BuildController(imageService);
        // 6 MB — over the 5MB limit
        var file = MakeFormFile("image/jpeg", 6 * 1024 * 1024, "big.jpg");

        var result = await controller.UploadImage(file, CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("5MB", badRequest.Value?.ToString());
    }

    [Fact]
    public async Task UploadImage_ValidJpeg_CallsServiceAndReturnsUrl()
    {
        const string expectedUrl = "https://myaccount.blob.core.windows.net/item-images/uuid/photo.jpg";
        var imageService = new FakeImageStorageService(expectedUrl);
        var controller = BuildController(imageService);
        var file = MakeFormFile("image/jpeg", 1024, "photo.jpg");

        var result = await controller.UploadImage(file, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<UploadImageResponse>(ok.Value);
        Assert.Equal(expectedUrl, response.Url);
        Assert.True(imageService.WasCalled);
    }

    [Fact]
    public async Task UploadImage_ValidPng_Returns200()
    {
        const string expectedUrl = "https://myaccount.blob.core.windows.net/item-images/uuid/logo.png";
        var imageService = new FakeImageStorageService(expectedUrl);
        var controller = BuildController(imageService);
        var file = MakeFormFile("image/png", 512, "logo.png");

        var result = await controller.UploadImage(file, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task UploadImage_NullFile_Returns400()
    {
        var imageService = new FakeImageStorageService("https://example.com/img.jpg");
        var controller = BuildController(imageService);

        var result = await controller.UploadImage(null!, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ── Fakes ──────────────────────────────────────────────────────────────────

    private sealed class FakeImageStorageService : IImageStorageService
    {
        private readonly string _url;
        public bool WasCalled { get; private set; }

        public FakeImageStorageService(string url) => _url = url;

        public Task<string> UploadImageAsync(Stream imageStream, string fileName, string contentType, CancellationToken cancellationToken = default)
        {
            WasCalled = true;
            return Task.FromResult(_url);
        }
    }

    private sealed class FakeItemService : IItemService
    {
        public Task<PagedResponse<ItemResponse>> GetItemsAsync(int page, int pageSize, string? search, string ownerId, CancellationToken ct = default)
            => throw new NotImplementedException();
        public Task<ItemResponse?> GetItemByIdAsync(Guid id, string ownerId, CancellationToken ct = default)
            => throw new NotImplementedException();
        public Task<ItemResponse> CreateItemAsync(CreateItemRequest request, string ownerId, CancellationToken ct = default)
            => throw new NotImplementedException();
        public Task<ItemResponse?> UpdateItemAsync(Guid id, UpdateItemRequest request, string ownerId, CancellationToken ct = default)
            => throw new NotImplementedException();
        public Task<bool> DeleteItemAsync(Guid id, string ownerId, CancellationToken ct = default)
            => throw new NotImplementedException();
        public Task<IEnumerable<SeasonalWarning>> GetSeasonalWarningsAsync(DateTime eventDate, CancellationToken ct = default)
            => throw new NotImplementedException();
    }
}
