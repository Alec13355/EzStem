using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Domain.Enums;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Tests.Services;

public class MasterFlowerServiceTests
{
    private const string TestOwnerId = "owner-123";
    private const string OtherOwnerId = "owner-999";

    private EzStemDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<EzStemDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new EzStemDbContext(options);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsOnlyOwnerFlowers()
    {
        using var context = CreateInMemoryContext();
        var service = new MasterFlowerService(context);

        context.MasterFlowers.AddRange(
            new MasterFlower
            {
                Id = Guid.NewGuid(),
                OwnerId = TestOwnerId,
                Name = "Rose",
                Unit = FlowerUnit.Stem,
                CostPerUnit = 2.5m,
                UnitsPerBunch = 1,
                Category = "Roses",
                IsActive = true
            },
            new MasterFlower
            {
                Id = Guid.NewGuid(),
                OwnerId = OtherOwnerId,
                Name = "Tulip",
                Unit = FlowerUnit.Bunch,
                CostPerUnit = 10m,
                UnitsPerBunch = 10,
                Category = "Tulips",
                IsActive = true
            });
        await context.SaveChangesAsync();

        var result = (await service.GetAllAsync(TestOwnerId)).ToList();

        Assert.Single(result);
        Assert.Equal("Rose", result[0].Name);
    }

    [Fact]
    public async Task GetAllAsync_FiltersActiveFlowersOnly()
    {
        using var context = CreateInMemoryContext();
        var service = new MasterFlowerService(context);

        context.MasterFlowers.AddRange(
            new MasterFlower
            {
                Id = Guid.NewGuid(),
                OwnerId = TestOwnerId,
                Name = "Rose",
                Unit = FlowerUnit.Stem,
                CostPerUnit = 2.5m,
                UnitsPerBunch = 1,
                Category = "Roses",
                IsActive = true
            },
            new MasterFlower
            {
                Id = Guid.NewGuid(),
                OwnerId = TestOwnerId,
                Name = "Tulip",
                Unit = FlowerUnit.Bunch,
                CostPerUnit = 10m,
                UnitsPerBunch = 10,
                Category = "Tulips",
                IsActive = false
            });
        await context.SaveChangesAsync();

        var result = (await service.GetAllAsync(TestOwnerId)).ToList();

        Assert.Single(result);
        Assert.Equal("Rose", result[0].Name);
    }

    [Fact]
    public async Task GetAllAsync_FiltersCategory()
    {
        using var context = CreateInMemoryContext();
        var service = new MasterFlowerService(context);

        context.MasterFlowers.AddRange(
            new MasterFlower
            {
                Id = Guid.NewGuid(),
                OwnerId = TestOwnerId,
                Name = "Rose",
                Unit = FlowerUnit.Stem,
                CostPerUnit = 2.5m,
                UnitsPerBunch = 1,
                Category = "Roses",
                IsActive = true
            },
            new MasterFlower
            {
                Id = Guid.NewGuid(),
                OwnerId = TestOwnerId,
                Name = "Tulip",
                Unit = FlowerUnit.Bunch,
                CostPerUnit = 10m,
                UnitsPerBunch = 10,
                Category = "Tulips",
                IsActive = true
            });
        await context.SaveChangesAsync();

        var result = (await service.GetAllAsync(TestOwnerId, "Roses")).ToList();

        Assert.Single(result);
        Assert.Equal("Rose", result[0].Name);
    }

    [Fact]
    public async Task GetCategoriesAsync_ReturnsDistinctCategories()
    {
        using var context = CreateInMemoryContext();
        var service = new MasterFlowerService(context);

        context.MasterFlowers.AddRange(
            new MasterFlower
            {
                Id = Guid.NewGuid(),
                OwnerId = TestOwnerId,
                Name = "Rose Red",
                Unit = FlowerUnit.Stem,
                CostPerUnit = 2.5m,
                UnitsPerBunch = 1,
                Category = "Roses",
                IsActive = true
            },
            new MasterFlower
            {
                Id = Guid.NewGuid(),
                OwnerId = TestOwnerId,
                Name = "Rose Pink",
                Unit = FlowerUnit.Stem,
                CostPerUnit = 2.7m,
                UnitsPerBunch = 1,
                Category = "Roses",
                IsActive = true
            },
            new MasterFlower
            {
                Id = Guid.NewGuid(),
                OwnerId = TestOwnerId,
                Name = "Tulip",
                Unit = FlowerUnit.Bunch,
                CostPerUnit = 10m,
                UnitsPerBunch = 10,
                Category = "Tulips",
                IsActive = true
            });
        await context.SaveChangesAsync();

        var result = (await service.GetCategoriesAsync(TestOwnerId)).ToList();

        Assert.Equal(2, result.Count);
        Assert.Contains("Roses", result);
        Assert.Contains("Tulips", result);
    }

    [Fact]
    public async Task CreateAsync_CreatesFlower()
    {
        using var context = CreateInMemoryContext();
        var service = new MasterFlowerService(context);

        var response = await service.CreateAsync(
            new CreateMasterFlowerRequest("Rose", "Stem", 2.25m, 1, "Roses"),
            TestOwnerId);

        Assert.NotEqual(Guid.Empty, response.Id);
        Assert.Equal("Rose", response.Name);
        Assert.Equal("Stem", response.Unit);
        Assert.Equal(2.25m, response.CostPerUnit);
        Assert.Equal(1, response.UnitsPerBunch);
        Assert.Equal("Roses", response.Category);
        Assert.True(response.IsActive);
    }

    [Fact]
    public async Task UpdateAsync_UpdatesFlower()
    {
        using var context = CreateInMemoryContext();
        var service = new MasterFlowerService(context);

        var flower = new MasterFlower
        {
            Id = Guid.NewGuid(),
            OwnerId = TestOwnerId,
            Name = "Rose",
            Unit = FlowerUnit.Stem,
            CostPerUnit = 2.5m,
            UnitsPerBunch = 1,
            Category = "Roses",
            IsActive = true
        };
        context.MasterFlowers.Add(flower);
        await context.SaveChangesAsync();

        var response = await service.UpdateAsync(
            flower.Id,
            new UpdateMasterFlowerRequest("Updated Rose", "Bunch", 3m, 10, "Updated Roses"),
            TestOwnerId);

        Assert.NotNull(response);
        Assert.Equal("Updated Rose", response!.Name);
        Assert.Equal("Bunch", response.Unit);
        Assert.Equal(3m, response.CostPerUnit);
        Assert.Equal(10, response.UnitsPerBunch);
        Assert.Equal("Updated Roses", response.Category);
    }

    [Fact]
    public async Task DeleteAsync_SoftDeletesFlower()
    {
        using var context = CreateInMemoryContext();
        var service = new MasterFlowerService(context);

        var flower = new MasterFlower
        {
            Id = Guid.NewGuid(),
            OwnerId = TestOwnerId,
            Name = "Rose",
            Unit = FlowerUnit.Stem,
            CostPerUnit = 2.5m,
            UnitsPerBunch = 1,
            Category = "Roses",
            IsActive = true
        };
        context.MasterFlowers.Add(flower);
        await context.SaveChangesAsync();

        var deleted = await service.DeleteAsync(flower.Id, TestOwnerId);
        var result = await service.GetAllAsync(TestOwnerId);

        Assert.True(deleted);
        Assert.Empty(result);

        // Verify it's soft-deleted (still in DB but IsActive=false)
        var dbFlower = await context.MasterFlowers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(f => f.Id == flower.Id);
        Assert.NotNull(dbFlower);
        Assert.False(dbFlower!.IsActive);
    }

    [Fact]
    public async Task ImportFromPdfAsync_UpsertsFlowers()
    {
        using var context = CreateInMemoryContext();
        var service = new MasterFlowerService(context);
        var mockOcr = new MockOcrService();

        // Pre-existing flower with same name and category
        var existing = new MasterFlower
        {
            Id = Guid.NewGuid(),
            OwnerId = TestOwnerId,
            Name = "Rose",
            Unit = FlowerUnit.Stem,
            CostPerUnit = 2.0m,
            UnitsPerBunch = 1,
            Category = "Roses",
            IsActive = true
        };
        context.MasterFlowers.Add(existing);
        await context.SaveChangesAsync();

        using var stream = new MemoryStream();
        var result = await service.ImportFromPdfAsync(stream, TestOwnerId, mockOcr);

        Assert.Equal(2, result.Imported);  // 1 updated, 1 new
        Assert.Equal(0, result.Skipped);
        Assert.Empty(result.Errors);
        
        var allFlowers = (await service.GetAllAsync(TestOwnerId)).ToList();
        Assert.Equal(2, allFlowers.Count);
        
        // Check that existing was updated
        var rose = allFlowers.First(f => f.Name == "Rose");
        Assert.Equal(2.5m, rose.CostPerUnit);  // Updated from mock data
    }

    private class MockOcrService : IOcrService
    {
        public Task<IEnumerable<ParsedFlowerRow>> ParseFlowerPdfAsync(Stream pdfStream, CancellationToken ct = default)
        {
            var rows = new List<ParsedFlowerRow>
            {
                new ParsedFlowerRow("Rose", "Stem", 2.5m, 1, "Roses"),
                new ParsedFlowerRow("Tulip", "Bunch", 10m, 10, "Tulips")
            };
            return Task.FromResult<IEnumerable<ParsedFlowerRow>>(rows);
        }
    }
}
