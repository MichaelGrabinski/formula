from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('formula', '0040_merge_20250813_1602'),
    ]

    operations = [
        migrations.CreateModel(
            name='PersonalSchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('week_start', models.DateField(db_index=True)),
                ('data', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'personal_schedules',
                'ordering': ['-updated_at'],
            },
        ),
    ]
