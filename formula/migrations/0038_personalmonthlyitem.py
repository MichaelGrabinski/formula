from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("formula", "0037_personalfinancialentry_category_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="PersonalMonthlyItem",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("type", models.CharField(choices=[("INCOME", "Income"), ("EXPENSE", "Expense")], max_length=10)),
                ("category", models.CharField(blank=True, max_length=255, null=True)),
                ("day_of_month", models.PositiveSmallIntegerField(blank=True, help_text="Day of month this is due/received (1-31)", null=True)),
                ("notes", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["type", "title"],
            },
        ),
    ]
