using EzStem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EzStem.Infrastructure.Data;

public class EzStemDbContext : DbContext
{
    public EzStemDbContext(DbContextOptions<EzStemDbContext> options) : base(options) { }

    public DbSet<Item> Items => Set<Item>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeItem> RecipeItems => Set<RecipeItem>();
    public DbSet<FloristEvent> Events => Set<FloristEvent>();
    public DbSet<EventRecipe> EventRecipes => Set<EventRecipe>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderLineItem> OrderLineItems => Set<OrderLineItem>();
    public DbSet<PricingConfig> PricingConfigs => Set<PricingConfig>();
    public DbSet<FlexItem> FlexItems => Set<FlexItem>();
    public DbSet<EventItem> EventItems => Set<EventItem>();
    public DbSet<EventFlower> EventFlowers => Set<EventFlower>();
    public DbSet<EventItemFlower> EventItemFlowers => Set<EventItemFlower>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Item configuration
        modelBuilder.Entity<Item>(entity =>
        {
            entity.Property(i => i.CostPerStem).HasPrecision(18, 4);
            entity.HasQueryFilter(i => !i.IsDeleted);
            entity.HasIndex(i => i.Name);
            entity.HasIndex(i => i.VendorId);
            entity.HasIndex(i => i.IsDeleted);
            entity.HasIndex(i => i.OwnerId);
        });

        // Vendor configuration
        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasQueryFilter(v => !v.IsDeleted);
            entity.HasIndex(v => v.Name);
            entity.HasIndex(v => v.IsDeleted);
        });

        // Recipe configuration
        modelBuilder.Entity<Recipe>(entity =>
        {
            entity.Property(r => r.LaborCost).HasPrecision(18, 4);
            entity.HasQueryFilter(r => !r.IsDeleted);
            entity.HasIndex(r => r.Name);
            entity.HasIndex(r => r.IsDeleted);
            entity.HasIndex(r => r.OwnerId);
        });

        // RecipeItem configuration
        modelBuilder.Entity<RecipeItem>(entity =>
        {
            entity.Property(r => r.Quantity).HasPrecision(18, 4);
            entity.Property(r => r.CostPerStem).HasPrecision(18, 4);
        });

        // FloristEvent configuration
        modelBuilder.Entity<FloristEvent>(entity =>
        {
            entity.Property(e => e.TotalBudget).HasPrecision(18, 4);
            entity.Property(e => e.ProfitMultiple).HasPrecision(18, 4);
            entity.Property(e => e.UpdatedAt);
            entity.HasQueryFilter(e => !e.IsDeleted);
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.EventDate);
            entity.HasIndex(e => e.IsDeleted);
            entity.HasIndex(e => e.OwnerId);
        });

        // Order configuration
        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(o => o.WastePercentage).HasPrecision(18, 4);
            entity.HasQueryFilter(o => !o.IsDeleted);
            entity.HasIndex(o => o.EventId);
            entity.HasIndex(o => o.IsDeleted);
            entity.HasIndex(o => o.OwnerId);
        });

        // OrderLineItem configuration
        modelBuilder.Entity<OrderLineItem>(entity =>
        {
            entity.Property(o => o.QuantityNeeded).HasPrecision(18, 4);
            entity.Property(o => o.QuantityOrdered).HasPrecision(18, 4);
            entity.Property(o => o.CostPerUnit).HasPrecision(18, 4);
        });

        // PricingConfig configuration
        modelBuilder.Entity<PricingConfig>(entity =>
        {
            entity.Property(p => p.DefaultMarkupPercentage).HasPrecision(18, 4);
            entity.Property(p => p.DefaultLaborRate).HasPrecision(18, 4);
            entity.HasIndex(p => p.OwnerId);
        });

        // FlexItem configuration
        modelBuilder.Entity<FlexItem>(entity =>
        {
            entity.Property(f => f.QuantityNeeded).HasPrecision(18, 4);
            entity.HasIndex(f => f.EventId);
        });

        // EventItem configuration
        modelBuilder.Entity<EventItem>(entity =>
        {
            entity.Property(e => e.Price).HasPrecision(18, 4);
            entity.HasOne(e => e.Event)
                .WithMany()
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.EventId);
        });

        // EventFlower configuration
        modelBuilder.Entity<EventFlower>(entity =>
        {
            entity.Property(e => e.PricePerStem).HasPrecision(18, 4);
            entity.HasOne(e => e.Event)
                .WithMany()
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.EventId);
        });

        // EventItemFlower configuration
        modelBuilder.Entity<EventItemFlower>(entity =>
        {
            entity.HasOne(e => e.EventItem)
                .WithMany(i => i.RecipeFlowers)
                .HasForeignKey(e => e.EventItemId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.EventFlower)
                .WithMany(f => f.UsedInItems)
                .HasForeignKey(e => e.EventFlowerId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(e => e.EventItemId);
            entity.HasIndex(e => e.EventFlowerId);
        });
    }
}
