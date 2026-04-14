using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EzStem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSeasonalItemFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSeasonalItem",
                table: "Items",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "LeadTimeDays",
                table: "Items",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeasonalEndMonth",
                table: "Items",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeasonalStartMonth",
                table: "Items",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSeasonalItem",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "LeadTimeDays",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "SeasonalEndMonth",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "SeasonalStartMonth",
                table: "Items");
        }
    }
}
