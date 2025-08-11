from django.core.management.base import BaseCommand
from route.models import Property, Asset, Unit, Repair
from django.utils import timezone
import random

class Command(BaseCommand):
    help = 'Creates test data for the application'

    def handle(self, *args, **kwargs):
        self.stdout.write('Deleting old data...')
        Property.objects.all().delete()
        Asset.objects.all().delete()
        Unit.objects.all().delete()
        Repair.objects.all().delete()

        self.stdout.write('Creating new test data...')

        # Create Properties
        prop1 = Property.objects.create(name='Oakwood Apartments', address='123 Oak Ave, Springfield', property_type='Residential')
        prop2 = Property.objects.create(name='Maple Business Center', address='456 Maple St, Springfield', property_type='Commercial')
        prop3 = Property.objects.create(name='Sunset Villa', address='789 Sunset Blvd, Hill Valley', property_type='Residential')

        # Create Units for Properties
        Unit.objects.create(property=prop1, unit_number='101', is_occupied=True)
        Unit.objects.create(property=prop1, unit_number='102', is_occupied=False)
        Unit.objects.create(property=prop2, unit_number='A', is_occupied=True)

        # Create Repairs
        repair1 = Repair.objects.create(
            property=prop1,
            description='Leaky faucet in kitchen',
            status='Pending',
            priority='High',
            reported_date=timezone.now()
        )
        repair2 = Repair.objects.create(
            property=prop2,
            description='Broken window in main lobby',
            status='In Progress',
            priority='Urgent',
            reported_date=timezone.now()
        )

        # Create Assets
        Asset.objects.create(name='Lawn Mower', category='Landscaping', repair=repair1)
        Asset.objects.create(name='HVAC Unit', category='Building Systems', repair=None)
        Asset.objects.create(name='Security Camera System', category='Security', repair=repair2)
        Asset.objects.create(name='Fire Extinguisher', category='Safety', repair=None)

        self.stdout.write(self.style.SUCCESS('Successfully created test data!'))
