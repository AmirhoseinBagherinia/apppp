from django.urls import path
from core import views

urlpatterns = [
    path("api/v1/lessons/<str:lesson_id>/complete/", views.complete_lesson_view),
    path("api/v1/flashcards/<str:card_id>/review/", views.review_flashcard_view),
]
