using EzStem.API.Infrastructure;
using EzStem.Application.Interfaces;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Connection string 'DefaultConnection' is missing or empty. Set ConnectionStrings__DefaultConnection in app settings.");

builder.Services.AddDbContext<EzStemDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddScoped<IVendorService, VendorService>();
builder.Services.AddScoped<IRecipeService, RecipeService>();
builder.Services.AddScoped<IPricingService, PricingService>();
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IEventItemService, EventItemService>();
builder.Services.AddScoped<IEventFlowerService, EventFlowerService>();
builder.Services.AddScoped<IEventItemFlowerService, EventItemFlowerService>();
builder.Services.AddScoped<IMasterFlowerService, MasterFlowerService>();
builder.Services.AddScoped<IOcrService, AzureOcrService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IFlexItemService, FlexItemService>();
builder.Services.AddScoped<IImageStorageService, AzureImageStorageService>();

builder.Services.AddAuthentication()
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

var allowedOrigins= builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

await DatabaseMigrationService.RunMigrationsAsync(app.Services, app.Logger);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler(errorApp => errorApp.Run(async ctx =>
{
    var ex = ctx.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
    ctx.Response.ContentType = "application/json";
    ctx.Response.StatusCode = ex is UnauthorizedAccessException ? 401 : 500;
    await ctx.Response.WriteAsJsonAsync(new { error = ex?.Message ?? "An unexpected error occurred." });
}));

app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
