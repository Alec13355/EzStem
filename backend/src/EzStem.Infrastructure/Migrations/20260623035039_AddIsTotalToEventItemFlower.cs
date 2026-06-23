using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EzStem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsTotalToEventItemFlower : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsTotal",
                table: "EventItemFlowers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsTotal",
                table: "EventItemFlowers");
        }
    }
}
