from myagi.settings.base_settings import *
import braintree

msg = "Set the %s environment variable"
def get_env_variable(var_name):
    try:
        return os.environ[var_name]
    except KeyError:
        error_msg = msg % var_name
        raise ImproperlyConfigured(error_msg)


ADMINS = (
    ('Jon Huber', 'jon@commoncode.com.au'),
    ('Tom Mcleod', 'tom.mcleod@myagi.com.au'),
    ('Simon Turner', 'simon.turner@myagi.com.au'),
    ('Alex McLeod', 'alex.mcleod@myagi.com.au'),
    ('Evan Soderberg', 'evan.soderberg@myagi.com.au')
)

HOSTING_ENV = get_env_variable('HOSTING_ENV')

### Databases ############

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql_psycopg2',
#         'NAME': 'myagi2',
#         'USER': 'myagi',
#         'PASSWORD': 'HsDvf3sRG',
#         'HOST': 'myagi-live.cqfvrpr3cagt.us-west-2.rds.amazonaws.com',
#         'PORT': '5432',
#     },
# }

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': get_env_variable('DEFAULT_DB_NAME'),
        'USER': get_env_variable('DEFAULT_DB_USER'),
        'PASSWORD': get_env_variable('DEFAULT_DB_PASSWORD'),
        'HOST': get_env_variable('DEFAULT_DB_HOST'),
        'PORT': '5432',
    },
}

### STATIC & MEDIA Storage ############

DEFAULT_FILE_STORAGE = "storages.backends.s3boto.S3BotoStorage"
STATICFILES_STORAGE = "pipeline.storage.PipelineCachedStorage"

AWS_ACCESS_KEY_ID = get_env_variable('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = get_env_variable('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = get_env_variable('AWS_STORAGE_BUCKET_NAME')
AWS_QUERYSTRING_AUTH = False

MEDIA_URL = get_env_variable('MEDIA_URL')
STATIC_URL = "/static/"
MEDIA_ROOT = ""
STATIC_ROOT = "/home/myagi/static/"

THUMBNAIL_DEFAULT_STORAGE = "storages.backends.s3boto.S3BotoStorage"

### Django Session #######

SESSION_COOKIE_DOMAIN = get_env_variable('SESSION_COOKIE_DOMAIN')


### Braintree production settings ##########

braintree.Configuration.configure(
    braintree.Environment.Production,
    'qs4y7kzvk87scbnr',
    'rzd6pgmzsw5xf388',
    'fb9a9bedb1404fc4ba264f6f29abfc71'
)

BRAINTREE_JS_KEY = get_env_variable('BRAINTREE_JS_KEY')

BRAINTREE_CURRENCY_PROCESSOR_IDS = {
    'AUD': 'myagiAUD',
    'USD': 'myagiUSD',
    'GBP': 'myagiGBP',
    'EUR': 'myagiEUR'
}


BRAINTREE_TIMEZONE = 'Australia/Melbourne'


### Cache business ############

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': get_env_variable('DEFAULT_CACHE_DSN'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}



### Quoth the Raven (Sentry DSN) ###########
RAVEN_CONFIG = {
    'dsn': get_env_variable('RAVEN_DSN'),
}


### Logging business ##########

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'formatters': {
        'standard': {
            'format' : "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s",
            'datefmt' : "%d/%b/%Y %H:%M:%S"
        },
    },
    'handlers': {
        'console':{
            'level':'INFO',
            'class':'logging.StreamHandler',
            'formatter': 'standard'
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'filters': []
        },
    },
    'loggers': {
        'django': {
            'handlers':['console'],
            'level':'WARN',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'training': {
            'handlers': ['console'], #'mail_admins'
            'level': 'ERROR',
            'propagate': False,
        },
    }
}

### Email ##########
SERVER_EMAIL = "production@myagi.com"

### Celery ##########

BROKER_URL = 'sqs://@'
BROKER_TRANSPORT_OPTIONS = {
    'visibility_timeout': 600,
    'region': 'us-west-2',
    'queue_name_prefix': HOSTING_ENV + '-',
}

### Haystack ########

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
        'URL': get_env_variable('HAYSTACK_URL'),
        'INDEX_NAME': 'haystack',
        'TIMEOUT': 3,
    },
}

####################
# MIXPANEL SETTINGS #
####################
ENVIRONMENT = 'production'
MIXPANEL_PROJECT_TOKEN = 'd8f0b75786801d3cf700bcfd05fe4f2e'


##########
# PUSHER #
##########
PUSHER_APP_ID = '142582'
PUSHER_KEY = '8f18a9833f619a1dba92'
PUSHER_SECRET = '5d2a02057d34b51948e5'
