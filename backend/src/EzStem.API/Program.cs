using EzStem.Application.Interfaces;
using EzStem.Infrastructure.Data;
using EzStem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<EzStemDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found. See appsettings.Development.json.")
    ));

builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddScoped<IVendorService, VendorService>();
builder.Services.AddScoped<IRecipeService, RecipeService>();
builder.Services.AddScoped<IPricingService, PricingService>();
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IOrderService, OrderService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular");
app.UseAuthorization();
app.MapControllers();

app.Run();
