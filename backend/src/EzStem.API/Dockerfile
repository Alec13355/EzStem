FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/EzStem.API/EzStem.API.csproj", "src/EzStem.API/"]
COPY ["src/EzStem.Application/EzStem.Application.csproj", "src/EzStem.Application/"]
COPY ["src/EzStem.Infrastructure/EzStem.Infrastructure.csproj", "src/EzStem.Infrastructure/"]
COPY ["src/EzStem.Domain/EzStem.Domain.csproj", "src/EzStem.Domain/"]
RUN dotnet restore "src/EzStem.API/EzStem.API.csproj"
COPY . .
RUN dotnet build "src/EzStem.API/EzStem.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "src/EzStem.API/EzStem.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EzStem.API.dll"]
