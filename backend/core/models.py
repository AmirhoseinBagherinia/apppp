"""
Django ORM Models for Shiraz SAD Gamified & Language Learning Platform
Covers Project 05 & Project 08 Use Cases (UC1 - UC8) + AI Telemetry Logs
"""

from django.db import models
from django.contrib.auth.models import AbstractUser


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("learner", "Learner"),
        ("teacher", "Teacher / Tutor"),
        ("admin", "Admin / Moderator"),
    ]
    username = models.CharField(max_length=80, unique=True)
    display_name = models.CharField(max_length=120)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="learner")
    level = models.IntegerField(default=1)
    xp = models.IntegerField(default=120)
    gems = models.IntegerField(default=50)
    streak_days = models.IntegerField(default=3)
    streak_freeze_active = models.BooleanField(default=True)
    last_active_date = models.DateField(null=True, blank=True)
    cefr_level = models.CharField(max_length=10, default="B1")
    interests = models.JSONField(default=list)
    preferred_style = models.CharField(max_length=40, default="Analogy")
    badges = models.JSONField(default=list)
    owned_items = models.JSONField(default=list)
    weak_topics = models.JSONField(default=list)
    is_blocked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Course(models.Model):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=80)
    difficulty = models.CharField(max_length=40)
    author_name = models.CharField(max_length=120)
    description = models.TextField()
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Lesson(models.Model):
    course = models.ForeignKey(Course, related_name="lessons", on_delete=models.CASCADE)
    order_index = models.IntegerField(default=1)
    title = models.CharField(max_length=200)
    summary = models.TextField()
    content_markdown = models.TextField()
    xp_reward = models.IntegerField(default=50)
    quiz_json = models.JSONField(default=list)


class Flashcard(models.Model):
    """SM-2 Spaced Repetition Flashcard (Project 08 UC2 & UC7)"""
    user = models.ForeignKey(UserProfile, related_name="flashcards", on_delete=models.CASCADE)
    deck_name = models.CharField(max_length=120)
    front_text = models.CharField(max_length=255)
    back_text = models.TextField()
    example_sentence = models.TextField(blank=True)
    cefr_level = models.CharField(max_length=10, default="B1")
    repetitions = models.IntegerField(default=0)
    interval_days = models.IntegerField(default=1)
    easiness_factor = models.FloatField(default=2.5)
    next_review_date = models.DateField()


class DailyQuest(models.Model):
    """Personalized AI Daily Quest (Project 05 UC4)"""
    user = models.ForeignKey(UserProfile, related_name="quests", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=80)
    target_count = models.IntegerField(default=1)
    current_count = models.IntegerField(default=0)
    xp_reward = models.IntegerField(default=40)
    gem_reward = models.IntegerField(default=15)
    is_completed = models.BooleanField(default=False)
    generated_by_ai = models.BooleanField(default=True)


class AIUsageLog(models.Model):
    """Admin Audit & Cost Control Log (Page 5, 13, 22, 23)"""
    user = models.ForeignKey(UserProfile, null=True, on_delete=models.SET_NULL)
    feature_name = models.CharField(max_length=100)
    prompt_id = models.CharField(max_length=80)
    model_name = models.CharField(max_length=80, default="gemini-3.8-flash")
    latency_ms = models.IntegerField(default=0)
    estimated_tokens = models.IntegerField(default=0)
    estimated_cost_usd = models.DecimalField(max_digits=8, decimal_places=5, default=0.0)
    cache_hit = models.BooleanField(default=False)
    validation_passed = models.BooleanField(default=True)
    status = models.CharField(max_length=40, default="success")
    created_at = models.DateTimeField(auto_now_add=True)
