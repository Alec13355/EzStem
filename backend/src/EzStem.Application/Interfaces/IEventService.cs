using EzStem.Application.DTOs;

namespace EzStem.Application.Interfaces;

public interface IEventService
{
    Task<PagedResponse<EventResponse>> GetEventsAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task<EventResponse?> GetEventByIdAsync(Guid id, CancellationToken ct = default);
    Task<EventResponse> CreateEventAsync(CreateEventRequest request, CancellationToken ct = default);
    Task<EventResponse?> UpdateEventAsync(Guid id, UpdateEventRequest request, CancellationToken ct = default);
    Task<bool> DeleteEventAsync(Guid id, CancellationToken ct = default);
    Task<EventRecipeResponse?> AddRecipeToEventAsync(Guid eventId, AddEventRecipeRequest request, CancellationToken ct = default);
    Task<EventRecipeResponse?> UpdateEventRecipeAsync(Guid eventId, Guid recipeId, UpdateEventRecipeRequest request, CancellationToken ct = default);
    Task<bool> RemoveRecipeFromEventAsync(Guid eventId, Guid recipeId, CancellationToken ct = default);
    Task<EventSummaryResponse?> GetEventSummaryAsync(Guid eventId, CancellationToken ct = default);
    Task<ProductionSheetResponse?> GetProductionSheetAsync(Guid eventId, CancellationToken ct = default);
}
