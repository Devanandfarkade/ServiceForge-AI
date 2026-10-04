"""
ServiceForge AI — Idempotent Development Data Seeder
Populates single-table DynamoDB datastore with real customer and asset master records for org-8841-alpha.
"""

import boto3
import os
import sys

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "ServiceForge")
ORG_ID = "org-8841-alpha"

CUSTOMERS = [
    {
        "PK": f"ORG#{ORG_ID}",
        "SK": "CUST#c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "GSI1PK": f"ORG#{ORG_ID}#CUSTOMERS",
        "GSI1SK": "CUST#c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "organizationId": ORG_ID,
        "customerId": "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "name": "Industrial Plastics Corp",
        "companyName": "Industrial Plastics Corp",
        "industry": "Manufacturing & Materials",
        "primaryContact": "Robert Sterling",
        "contactEmail": "r.sterling@industrialplastics.com",
        "contactPhone": "+1 (555) 234-5678",
        "serviceLevel": "Enterprise Tier 1",
        "status": "ACTIVE",
        "address": "450 Industrial Parkway, Sector 4, Houston, TX 77001"
    },
    {
        "PK": f"ORG#{ORG_ID}",
        "SK": "CUST#cust-vanguard",
        "GSI1PK": f"ORG#{ORG_ID}#CUSTOMERS",
        "GSI1SK": "CUST#cust-vanguard",
        "organizationId": ORG_ID,
        "customerId": "cust-vanguard",
        "name": "Vanguard Logistics Hub",
        "companyName": "Vanguard Logistics Hub",
        "industry": "Logistics & Supply Chain",
        "primaryContact": "Elena Rostova",
        "contactEmail": "e.rostova@vanguardlogistics.com",
        "contactPhone": "+1 (555) 876-5432",
        "serviceLevel": "Priority SLA (4-Hour Response)",
        "status": "ACTIVE",
        "address": "1200 Cargo Way, Dock 14, Chicago, IL 60607"
    },
    {
        "PK": f"ORG#{ORG_ID}",
        "SK": "CUST#cust-titan",
        "GSI1PK": f"ORG#{ORG_ID}#CUSTOMERS",
        "GSI1SK": "CUST#cust-titan",
        "organizationId": ORG_ID,
        "customerId": "cust-titan",
        "name": "Titan Energy Systems",
        "companyName": "Titan Energy Systems",
        "industry": "Power & Renewable Energy",
        "primaryContact": "David Vance",
        "contactEmail": "d.vance@titanenergy.com",
        "contactPhone": "+1 (555) 901-2345",
        "serviceLevel": "Critical Infrastructure 24/7",
        "status": "ACTIVE",
        "address": "888 Power Line Road, Substation B, Phoenix, AZ 85001"
    }
]

ASSETS = [
    {
        "PK": f"ORG#{ORG_ID}",
        "SK": "ASSET#a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
        "GSI1PK": f"ORG#{ORG_ID}#CUST#c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "GSI1SK": "ASSET#a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
        "organizationId": ORG_ID,
        "customerId": "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "assetId": "a9b8c7d6-e5f4-4a3b-2c1d-0e9f8a7b6c5d",
        "name": "Industrial Air Compressor AC-4500",
        "equipmentType": "Heavy Duty Rotary Screw Compressor",
        "serialNumber": "AC-4500-8841-X",
        "modelNumber": "Atlas Copco GA45+",
        "location": "Building B - Main Compressor Room",
        "installationDate": "2021-06-15",
        "status": "OPERATIONAL",
        "lastMaintenanceDate": "2026-01-10"
    },
    {
        "PK": f"ORG#{ORG_ID}",
        "SK": "ASSET#asset-chiller",
        "GSI1PK": f"ORG#{ORG_ID}#CUST#c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "GSI1SK": "ASSET#asset-chiller",
        "organizationId": ORG_ID,
        "customerId": "c8f1e2a3-9b4d-4e5f-8a1b-2c3d4e5f6a7b",
        "assetId": "asset-chiller",
        "name": "Chiller Unit Modular Chill-90",
        "equipmentType": "Air-Cooled Water Chiller 90-Ton",
        "serialNumber": "CHILL-90-2022-09",
        "modelNumber": "Trane CGAM-090",
        "location": "Rooftop HVAC Deck 2",
        "installationDate": "2022-09-01",
        "status": "REQUIRES_SERVICE",
        "lastMaintenanceDate": "2025-11-20"
    },
    {
        "PK": f"ORG#{ORG_ID}",
        "SK": "ASSET#asset-conveyor",
        "GSI1PK": f"ORG#{ORG_ID}#CUST#cust-vanguard",
        "GSI1SK": "ASSET#asset-conveyor",
        "organizationId": ORG_ID,
        "customerId": "cust-vanguard",
        "assetId": "asset-conveyor",
        "name": "High-Capacity Conveyor Drive System",
        "equipmentType": "Automated Parcel Sorting Conveyor",
        "serialNumber": "CONV-VANG-771",
        "modelNumber": "Interroll Modular 3000",
        "location": "Distribution Center A - Sorting Line 4",
        "installationDate": "2023-03-12",
        "status": "OPERATIONAL",
        "lastMaintenanceDate": "2026-02-01"
    },
    {
        "PK": f"ORG#{ORG_ID}",
        "SK": "ASSET#asset-generator",
        "GSI1PK": f"ORG#{ORG_ID}#CUST#cust-titan",
        "GSI1SK": "ASSET#asset-generator",
        "organizationId": ORG_ID,
        "customerId": "cust-titan",
        "assetId": "asset-generator",
        "name": "Backup Diesel Generator 500kW",
        "equipmentType": "Standby Power Generator",
        "serialNumber": "GEN-TITAN-500",
        "modelNumber": "Cummins C500D5e",
        "location": "Substation Enclosure South",
        "installationDate": "2020-11-05",
        "status": "OPERATIONAL",
        "lastMaintenanceDate": "2026-02-15"
    }
]

def seed_data():
    session = boto3.Session(region_name=AWS_REGION)
    dynamodb = session.resource("dynamodb")
    table = dynamodb.Table(TABLE_NAME)

    print(f"Seeding development data into DynamoDB table '{TABLE_NAME}' for org '{ORG_ID}'...")

    for cust in CUSTOMERS:
        table.put_item(Item=cust)
        print(f"  [+] Seeded Customer: {cust['name']} ({cust['customerId']})")

    for asset in ASSETS:
        table.put_item(Item=asset)
        print(f"  [+] Seeded Asset: {asset['name']} ({asset['assetId']})")

    print("Development data seeding complete.")

if __name__ == "__main__":
    seed_data()
