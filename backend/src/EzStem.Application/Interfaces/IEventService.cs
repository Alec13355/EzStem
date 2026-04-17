using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IEventService
{
    Task<PagedResponse<EventResponse>> GetEventsAsync(int page, int pageSize, string? search, string ownerId, CancellationToken ct = default);
    Task<EventResponse?> GetEventByIdAsync(Guid id, string ownerId, CancellationToken ct = default);
    Task<EventResponse> CreateEventAsync(CreateEventRequest request, string ownerId, CancellationToken ct = default);
    Task<EventResponse?> UpdateEventAsync(Guid id, UpdateEventRequest request, string ownerId, CancellationToken ct = default);
    Task<bool> DeleteEventAsync(Guid id, string ownerId, CancellationToken ct = default);
    Task<EventRecipeResponse?> AddRecipeToEventAsync(Guid eventId, AddEventRecipeRequest request, string ownerId, CancellationToken ct = default);
    Task<EventRecipeResponse?> UpdateEventRecipeAsync(Guid eventId, Guid recipeId, UpdateEventRecipeRequest request, string ownerId, CancellationToken ct = default);
    Task<bool> RemoveRecipeFromEventAsync(Guid eventId, Guid recipeId, string ownerId, CancellationToken ct = default);
    Task<EventSummaryResponse?> GetEventSummaryAsync(Guid eventId, string ownerId, CancellationToken ct = default);
    Task<ProductionSheetResponse?> GetProductionSheetAsync(Guid eventId, string ownerId, CancellationToken ct = default);
}
