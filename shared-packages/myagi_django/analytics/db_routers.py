

DEFAULT = "default"
ANALYTICS = "analytics"


class DatabaseRouter(object):

    """
    Allows you to specify a "DATABASE" class attribute which
    determines which db a model gets written and read to. If
    the specified DATABASE is not in settings.DATABASES, then
    this will just revert back to the default database (i.e.
    it will silently fail).
    """

    def db_for_read(self, model, **hints):
        from django.conf import settings
        specified_db =  getattr(model, "DATABASE", DEFAULT)
        return specified_db if specified_db in settings.DATABASES else DEFAULT

    def db_for_write(self, model, **hints):
        return self.db_for_read(model, **hints)

    def allow_relation(self, obj1, obj2, **hints):
        """
        Relations between objects are allowed if both objects are
        in the master/slave pool.
        """
        db_list = ('default')
        return obj1._state.db in db_list and obj2._state.db in db_list

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Only migrate AnalyticsModels to the analytics
        db (and no other), otherwise migrate all.
        """
        if db == ANALYTICS and not app_label == ANALYTICS:
            return False
        return True
