using EzStem.Application.DTOs;
using EzStem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EzStem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecipesController : ControllerBase
{
    private readonly IRecipeService _recipeService;

    public RecipesController(IRecipeService recipeService)
    {
        _recipeService = recipeService;
    }

    private string GetUserId() =>
        User.FindFirstValue("oid")
        ?? User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User identifier not found in token");

    [HttpGet]
    public async Task<ActionResult<PagedResponse<RecipeResponse>>> GetRecipes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _recipeService.GetRecipesAsync(page, pageSize, search, GetUserId(), ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RecipeResponse>> GetRecipe(Guid id, CancellationToken ct = default)
    {
        var recipe = await _recipeService.GetRecipeByIdAsync(id, GetUserId(), ct);
        if (recipe == null) return NotFound();
        return Ok(recipe);
    }

    [HttpPost]
    public async Task<ActionResult<RecipeResponse>> CreateRecipe(
        [FromBody] CreateRecipeRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var recipe = await _recipeService.CreateRecipeAsync(request, GetUserId(), ct);
            return CreatedAtAction(nameof(GetRecipe), new { id = recipe.Id }, recipe);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RecipeResponse>> UpdateRecipe(
        Guid id,
        [FromBody] UpdateRecipeRequest request,
        CancellationToken ct = default)
    {
        var recipe = await _recipeService.UpdateRecipeAsync(id, request, GetUserId(), ct);
        if (recipe == null) return NotFound();
        return Ok(recipe);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecipe(Guid id, CancellationToken ct = default)
    {
        var deleted = await _recipeService.DeleteRecipeAsync(id, GetUserId(), ct);
        if (!deleted) return NotFound();
        return NoContent();
    }

    [HttpGet("{id}/cost")]
    public async Task<ActionResult<RecipeCostResponse>> GetRecipeCost(Guid id, CancellationToken ct = default)
    {
        var cost = await _recipeService.GetRecipeCostAsync(id, ct);
        if (cost == null) return NotFound();
        return Ok(cost);
    }

    [HttpGet("{id}/pricing")]
    public async Task<ActionResult<RecipeCostResponse>> GetRecipePricing(Guid id, CancellationToken ct = default)
    {
        var cost = await _recipeService.GetRecipeCostAsync(id, ct);
        if (cost == null) return NotFound();
        return Ok(cost);
    }

    [HttpGet("{id}/scale")]
    public async Task<ActionResult<ScaleRecipeResponse>> ScaleRecipe(
        Guid id,
        [FromQuery] int factor = 1,
        CancellationToken ct = default)
    {
        var scaled = await _recipeService.ScaleRecipeAsync(id, factor, GetUserId(), ct);
        if (scaled == null) return NotFound();
        return Ok(scaled);
    }

    [HttpPost("{id}/duplicate")]
    public async Task<ActionResult<RecipeResponse>> DuplicateRecipe(Guid id, CancellationToken ct = default)
    {
        var recipe = await _recipeService.DuplicateRecipeAsync(id, GetUserId(), ct);
        if (recipe == null) return NotFound();
        return CreatedAtAction(nameof(GetRecipe), new { id = recipe.Id }, recipe);
    }

    [HttpPost("{id}/items")]
    public async Task<ActionResult<RecipeItemResponse>> AddItemToRecipe(
        Guid id,
        [FromBody] AddRecipeItemRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var recipeItem = await _recipeService.AddItemToRecipeAsync(id, request, GetUserId(), ct);
            if (recipeItem == null) return NotFound();
            return CreatedAtAction(nameof(GetRecipe), new { id }, recipeItem);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}/items/{itemId}")]
    public async Task<ActionResult<RecipeItemResponse>> UpdateRecipeItem(
        Guid id,
        Guid itemId,
        [FromBody] UpdateRecipeItemRequest request,
        CancellationToken ct = default)
    {
        var recipeItem = await _recipeService.UpdateRecipeItemAsync(id, itemId, request, GetUserId(), ct);
        if (recipeItem == null) return NotFound();
        return Ok(recipeItem);
    }

    [HttpDelete("{id}/items/{itemId}")]
    public async Task<IActionResult> RemoveItemFromRecipe(
        Guid id,
        Guid itemId,
        CancellationToken ct = default)
    {
        var deleted = await _recipeService.RemoveItemFromRecipeAsync(id, itemId, GetUserId(), ct);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
