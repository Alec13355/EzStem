using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EzStem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEventItemsAndFlowers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ProfitMultiple",
                table: "Events",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 1.0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalBudget",
                table: "Events",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "EventFlowers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PricePerStem = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    BunchSize = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventFlowers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventFlowers_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventItems_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventItemFlowers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventFlowerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StemsNeeded = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventItemFlowers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventItemFlowers_EventFlowers_EventFlowerId",
                        column: x => x.EventFlowerId,
                        principalTable: "EventFlowers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EventItemFlowers_EventItems_EventItemId",
                        column: x => x.EventItemId,
                        principalTable: "EventItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventFlowers_EventId",
                table: "EventFlowers",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventItemFlowers_EventFlowerId",
                table: "EventItemFlowers",
                column: "EventFlowerId");

            migrationBuilder.CreateIndex(
                name: "IX_EventItemFlowers_EventItemId",
                table: "EventItemFlowers",
                column: "EventItemId");

            migrationBuilder.CreateIndex(
                name: "IX_EventItems_EventId",
                table: "EventItems",
                column: "EventId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventItemFlowers");

            migrationBuilder.DropTable(
                name: "EventFlowers");

            migrationBuilder.DropTable(
                name: "EventItems");

            migrationBuilder.DropColumn(
                name: "ProfitMultiple",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "TotalBudget",
                table: "Events");
        }
    }
}
