from decimal import Decimal
from django.core.management.base import BaseCommand

from formula.models import Car


class Command(BaseCommand):
    help = "Seed example Car records for testing the public cars page."

    def handle(self, *args, **options):
        samples = [
            {
                "title": "2016 Ford F-250 Super Duty",
                "description": "Work-ready diesel pickup with service bed. Excellent for hauling and towing.",
                "year": 2016,
                "mileage": 98000,
                "price": Decimal("21500.00"),
            },
            {
                "title": "2014 Chevrolet Silverado 1500",
                "description": "Reliable truck with new brakes and tires, clean interior.",
                "year": 2014,
                "mileage": 120000,
                "price": Decimal("12500.00"),
            },
            {
                "title": "2018 Ram 2500",
                "description": "Strong Cummins diesel, well maintained, ideal for heavy work.",
                "year": 2018,
                "mileage": 76000,
                "price": Decimal("28900.00"),
            },
        ]

        created = 0
        for s in samples:
            defaults = {
                "description": s["description"],
                "year": s["year"],
                "mileage": s["mileage"],
                "price": s["price"],
                "is_active": True,
            }
            car, created_bool = Car.objects.get_or_create(title=s["title"], defaults=defaults)
            if created_bool:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created} sample cars."))
