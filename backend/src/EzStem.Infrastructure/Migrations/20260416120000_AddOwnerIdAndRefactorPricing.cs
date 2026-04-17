using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EzStem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerIdAndRefactorPricing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add OwnerId to Recipes
            migrationBuilder.AddColumn<string>(
                name: "OwnerId",
                table: "Recipes",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Recipes_OwnerId",
                table: "Recipes",
                column: "OwnerId");

            // Add OwnerId to Events
            migrationBuilder.AddColumn<string>(
                name: "OwnerId",
                table: "Events",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_OwnerId",
                table: "Events",
                column: "OwnerId");

            // Add OwnerId to Orders
            migrationBuilder.AddColumn<string>(
                name: "OwnerId",
                table: "Orders",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OwnerId",
                table: "Orders",
                column: "OwnerId");

            // Refactor PricingConfigs: drop old columns, add new ones
            migrationBuilder.DropColumn(name: "LaborDefaultCost", table: "PricingConfigs");
            migrationBuilder.DropColumn(name: "MarkupFactor", table: "PricingConfigs");
            migrationBuilder.DropColumn(name: "OverheadPercent", table: "PricingConfigs");

            migrationBuilder.AddColumn<string>(
                name: "OwnerId",
                table: "PricingConfigs",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DefaultMarkupPercentage",
                table: "PricingConfigs",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 35.0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DefaultLaborRate",
                table: "PricingConfigs",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 25.0m);

            migrationBuilder.CreateIndex(
                name: "IX_PricingConfigs_OwnerId",
                table: "PricingConfigs",
                column: "OwnerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Recipes_OwnerId", table: "Recipes");
            migrationBuilder.DropColumn(name: "OwnerId", table: "Recipes");

            migrationBuilder.DropIndex(name: "IX_Events_OwnerId", table: "Events");
            migrationBuilder.DropColumn(name: "OwnerId", table: "Events");

            migrationBuilder.DropIndex(name: "IX_Orders_OwnerId", table: "Orders");
            migrationBuilder.DropColumn(name: "OwnerId", table: "Orders");

            migrationBuilder.DropIndex(name: "IX_PricingConfigs_OwnerId", table: "PricingConfigs");
            migrationBuilder.DropColumn(name: "OwnerId", table: "PricingConfigs");
            migrationBuilder.DropColumn(name: "DefaultMarkupPercentage", table: "PricingConfigs");
            migrationBuilder.DropColumn(name: "DefaultLaborRate", table: "PricingConfigs");

            migrationBuilder.AddColumn<decimal>(
                name: "MarkupFactor",
                table: "PricingConfigs",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 3.0m);

            migrationBuilder.AddColumn<decimal>(
                name: "OverheadPercent",
                table: "PricingConfigs",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0.25m);

            migrationBuilder.AddColumn<decimal>(
                name: "LaborDefaultCost",
                table: "PricingConfigs",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 5.0m);
        }
    }
}
