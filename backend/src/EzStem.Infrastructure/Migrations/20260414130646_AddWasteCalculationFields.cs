using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EzStem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWasteCalculationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "WasteCalculationDate",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WastePercentage",
                table: "Orders",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WasteCalculationDate",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "WastePercentage",
                table: "Orders");
        }
    }
}
