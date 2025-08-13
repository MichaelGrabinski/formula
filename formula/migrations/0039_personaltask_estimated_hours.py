from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("formula", "0038_personalmonthlyitem"),
    ]

    operations = [
        migrations.AddField(
            model_name="personaltask",
            name="estimated_hours",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True),
        ),
    ]
