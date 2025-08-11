# Example management command to create initial data for testing
from django.core.management.base import BaseCommand
from route.models import Property, Unit, Asset, Repair, Project, FinancialEntry, Report, Document
from datetime import date
import random
from datetime import timedelta

class Command(BaseCommand):
    help = 'Create initial test data for repairs app'

    def handle(self, *args, **options):
        # Generate multiple Properties with Units, Assets, and Repairs
        for p in range(5):
            prop = Property.objects.create(
                name=f'Sample Property {p+1}',
                address=f'{100+p} Main St, Cityville'
            )
            # Create units for each property
            for u in range(1, random.randint(2, 5)):
                unit = Unit.objects.create(property=prop, unit_number=str(100+u))
                # Create some repairs per unit
                for r in range(random.randint(1, 3)):
                    asset = Asset.objects.create(
                        name=f'Asset {p+1}-{u}-{r+1}',
                        category=random.choice(['HVAC', 'Plumbing', 'Electrical'])
                    )
                    Repair.objects.create(
                        property=prop,
                        unit=unit,
                        asset=asset,
                        title=f'Repair {r+1} for Unit {unit.unit_number}',
                        description=f'Description for repair {r+1}',
                        priority=random.choice(['Low','Medium','High','Emergency']),
                        status=random.choice(['Open','Scheduled','In Progress']),
                        reported_by=random.choice(['Alice','Bob','Charlie']),
                        assigned_to=random.choice(['Dave','Eve','Frank']),
                        estimated_cost=round(random.uniform(50,500),2),
                        reported_date=date.today() - timedelta(days=random.randint(0,30)),
                        scheduled_date=(date.today() + timedelta(days=random.randint(1,30))) if random.choice([True,False]) else None,
                        category=random.choice(['Maintenance','Inspection','Repair'])
                    )

        # Generate Projects
        for i in range(10):
            Project.objects.create(
                name=f'Project {i}',
                description=f'Description for Project {i}'
            )

        # Generate Financial Entries
        for i in range(10):
            FinancialEntry.objects.create(
                date=date.today() - timedelta(days=random.randint(0, 365)),
                amount=random.uniform(100, 1000),
                description=f'Financial Entry {i}'
            )

        # Generate Reports
        for i in range(10):
            Report.objects.create(
                title=f'Report {i}',
                content=f'Content for Report {i}'
            )

        # Generate Documents
        for i in range(10):
            Document.objects.create(
                title=f'Document {i}',
                file=f'documents/sample{i}.txt'
            )

        self.stdout.write(self.style.SUCCESS('Test data created.'))
