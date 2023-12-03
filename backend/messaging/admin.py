from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from messaging.models import UserProfile
from messaging.models import Message


# class UserProfileInline(admin.StackedInline):
#     model = UserProfile
#     can_delete = False
#     verbose_name_plural = "Profile"
#     fk_name = "user"


# class CustomUserAdmin(BaseUserAdmin):
#     inlines = (UserProfileInline,)

#     def get_inline_instances(self, request, obj=None):
#         if not obj:
#             return list()
#         return super(CustomUserAdmin, self).get_inline_instances(request, obj)


# Re-register UserAdmin
# admin.site.unregister(User)
# admin.site.register(User, CustomUserAdmin)
admin.site.register(Message)
