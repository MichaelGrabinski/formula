from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("formula", "0044_savingsgoal_goal_type_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="savingsgoal",
            name="icon",
            field=models.CharField(max_length=32, blank=True, null=True, help_text="Optional emoji or short icon code"),
        ),
    ]
