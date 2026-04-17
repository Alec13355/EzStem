using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using EzStem.Domain.Entities;
using EzStem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Services;

public class EventService : IEventService
{
    private readonly EzStemDbContext _context;
    private readonly IRecipeService _recipeService;

    public EventService(EzStemDbContext context, IRecipeService recipeService)
    {
        _context = context;
        _recipeService = recipeService;
    }

    public async Task<PagedResponse<EventResponse>> GetEventsAsync(int page, int pageSize, string? search, string ownerId, CancellationToken ct = default)
    {
        var query = _context.Events
            .Include(e => e.EventRecipes).ThenInclude(er => er.Recipe)
            .Where(e => e.OwnerId == ownerId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(e => e.Name.Contains(search) || (e.ClientName != null && e.ClientName.Contains(search)));

        var total = await query.CountAsync(ct);
        var events = await query
            .OrderByDescending(e => e.EventDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResponse<EventResponse>(events.Select(MapToEventResponse), total, page, pageSize);
    }

    public async Task<EventResponse?> GetEventByIdAsync(Guid id, string ownerId, CancellationToken ct = default)
    {
        var evt = await _context.Events
            .Include(e => e.EventRecipes).ThenInclude(er => er.Recipe)
            .FirstOrDefaultAsync(e => e.Id == id && e.OwnerId == ownerId, ct);

        return evt == null ? null : MapToEventResponse(evt);
    }

    public async Task<EventResponse> CreateEventAsync(CreateEventRequest request, string ownerId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required", nameof(request.Name));

        var evt = new FloristEvent
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            EventDate = request.EventDate,
            ClientName = request.ClientName,
            Notes = request.Notes,
            Status = EventStatus.Draft,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Events.Add(evt);
        await _context.SaveChangesAsync(ct);
        return MapToEventResponse(evt);
    }

    public async Task<EventResponse?> UpdateEventAsync(Guid id, UpdateEventRequest request, string ownerId, CancellationToken ct = default)
    {
        var evt = await _context.Events
            .Include(e => e.EventRecipes).ThenInclude(er => er.Recipe)
            .FirstOrDefaultAsync(e => e.Id == id && e.OwnerId == ownerId, ct);

        if (evt == null) return null;

        if (request.Name != null) evt.Name = request.Name;
        if (request.EventDate.HasValue) evt.EventDate = request.EventDate.Value;
        if (request.ClientName != null) evt.ClientName = request.ClientName;
        if (request.Notes != null) evt.Notes = request.Notes;
        if (request.Status != null && Enum.TryParse<EventStatus>(request.Status, true, out var newStatus))
            evt.Status = newStatus;

        await _context.SaveChangesAsync(ct);
        return MapToEventResponse(evt);
    }

    public async Task<bool> DeleteEventAsync(Guid id, string ownerId, CancellationToken ct = default)
    {
        var evt = await _context.Events.FirstOrDefaultAsync(e => e.Id == id && e.OwnerId == ownerId, ct);
        if (evt == null) return false;

        evt.IsDeleted = true;
        evt.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<EventRecipeResponse?> AddRecipeToEventAsync(Guid eventId, AddEventRecipeRequest request, string ownerId, CancellationToken ct = default)
    {
        var evt = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);
        if (evt == null) return null;

        var recipe = await _context.Recipes.FirstOrDefaultAsync(r => r.Id == request.RecipeId, ct);
        if (recipe == null) throw new ArgumentException("Recipe not found");

        var eventRecipe = new EventRecipe
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            RecipeId = request.RecipeId,
            Quantity = request.Quantity
        };

        _context.EventRecipes.Add(eventRecipe);
        await _context.SaveChangesAsync(ct);

        var recipeCost = await _recipeService.GetRecipeCostAsync(request.RecipeId, ct);
        var unitCost = recipeCost?.TotalCost ?? 0;

        return new EventRecipeResponse(
            eventRecipe.Id, eventRecipe.RecipeId, recipe.Name,
            eventRecipe.Quantity, unitCost, unitCost * eventRecipe.Quantity);
    }

    public async Task<EventRecipeResponse?> UpdateEventRecipeAsync(Guid eventId, Guid recipeId, UpdateEventRecipeRequest request, string ownerId, CancellationToken ct = default)
    {
        var evt = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);
        if (evt == null) return null;

        var eventRecipe = await _context.EventRecipes
            .Include(er => er.Recipe)
            .FirstOrDefaultAsync(er => er.EventId == eventId && er.RecipeId == recipeId, ct);

        if (eventRecipe == null) return null;

        eventRecipe.Quantity = request.Quantity;
        await _context.SaveChangesAsync(ct);

        var recipeCost = await _recipeService.GetRecipeCostAsync(recipeId, ct);
        var unitCost = recipeCost?.TotalCost ?? 0;

        return new EventRecipeResponse(
            eventRecipe.Id, eventRecipe.RecipeId, eventRecipe.Recipe.Name,
            eventRecipe.Quantity, unitCost, unitCost * eventRecipe.Quantity);
    }

    public async Task<bool> RemoveRecipeFromEventAsync(Guid eventId, Guid recipeId, string ownerId, CancellationToken ct = default)
    {
        var evt = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);
        if (evt == null) return false;

        var eventRecipe = await _context.EventRecipes
            .FirstOrDefaultAsync(er => er.EventId == eventId && er.RecipeId == recipeId, ct);

        if (eventRecipe == null) return false;

        _context.EventRecipes.Remove(eventRecipe);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<EventSummaryResponse?> GetEventSummaryAsync(Guid eventId, string ownerId, CancellationToken ct = default)
    {
        var evt = await _context.Events
            .Include(e => e.EventRecipes).ThenInclude(er => er.Recipe).ThenInclude(r => r.RecipeItems)
            .FirstOrDefaultAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);

        if (evt == null) return null;

        var recipes = new List<EventRecipeResponse>();
        decimal totalCost = 0;

        foreach (var er in evt.EventRecipes)
        {
            var recipeCost = await _recipeService.GetRecipeCostAsync(er.RecipeId, ct);
            var unitCost = recipeCost?.TotalCost ?? 0;
            var lineCost = unitCost * er.Quantity;

            recipes.Add(new EventRecipeResponse(er.Id, er.RecipeId, er.Recipe.Name, er.Quantity, unitCost, lineCost));
            totalCost += lineCost;
        }

        var totalRevenue = totalCost * 3.0m;
        var totalProfit = totalRevenue - totalCost;
        var marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return new EventSummaryResponse(
            evt.Id, evt.Name, evt.EventDate, evt.Status.ToString(),
            totalCost, totalRevenue, totalProfit, marginPercent, recipes);
    }

    public async Task<ProductionSheetResponse?> GetProductionSheetAsync(Guid eventId, string ownerId, CancellationToken ct = default)
    {
        var evt = await _context.Events
            .Include(e => e.EventRecipes).ThenInclude(er => er.Recipe).ThenInclude(r => r.RecipeItems).ThenInclude(ri => ri.Item).ThenInclude(i => i.Vendor)
            .FirstOrDefaultAsync(e => e.Id == eventId && e.OwnerId == ownerId, ct);

        if (evt == null) return null;

        int totalStemCount = 0;
        var sheetRecipes = new List<ProductionSheetRecipe>();

        foreach (var er in evt.EventRecipes)
        {
            var lineItems = er.Recipe.RecipeItems.Select(ri => new ProductionSheetLineItem(
                ri.Item.Name, ri.Item.Vendor?.Name,
                ri.Quantity * er.Quantity, "stems")).ToList();

            totalStemCount += (int)er.Recipe.RecipeItems.Sum(ri => ri.Quantity * er.Quantity);
            sheetRecipes.Add(new ProductionSheetRecipe(er.Recipe.Name, er.Quantity, lineItems, er.Recipe.Description));
        }

        return new ProductionSheetResponse(evt.Id, evt.Name, evt.EventDate, evt.ClientName, sheetRecipes, totalStemCount);
    }

    private EventRecipeResponse MapToEventRecipeResponse(EventRecipe er)
    {
        var recipeCost = _recipeService.GetRecipeCostAsync(er.RecipeId).Result;
        var unitCost = recipeCost?.TotalCost ?? 0;
        return new EventRecipeResponse(er.Id, er.RecipeId, er.Recipe.Name, er.Quantity, unitCost, unitCost * er.Quantity);
    }

    private EventResponse MapToEventResponse(FloristEvent evt)
    {
        var eventRecipes = evt.EventRecipes.Select(MapToEventRecipeResponse);
        return new EventResponse(evt.Id, evt.Name, evt.EventDate, evt.ClientName, evt.Notes, evt.Status.ToString(), eventRecipes, evt.CreatedAt);
    }
}
