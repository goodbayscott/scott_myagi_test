from django.contrib import admin
from django import forms

# Registers all children of abstract model
# Code from https://lukedrummond.net/2014/02/abstract-models-and-the-django-admin/
# with a couple modifications


class _ModelFormTemplate(forms.ModelForm):
    #Add your template methods/search fields etc here
    pass


class _ModelAdminTemplate(admin.ModelAdmin):
    #Add any behavioural specifics you want here
    pass


class _GenericModelFormMeta(type):
    """
    This is where Python's metamagic happens.
    Classes that inherit from ``type`` do not create instances of a class, but 
    an object that encapsulates the definition of how that object should behave
    i.e. a 'class' object. Remember, in Python *everything* is an object.

    The value returned by our __new__ method is a newly instantiated object 
    of type 'type':

        >>>class MyMetaClass(type):
        >>>    pass
        >>>
        >>>MyMetaClass(object)(str) == type(str)
        True

    Read the amazing writeup again: http://stackoverflow.com/a/6581949
    """

    def __new__(cls, clsname, bases, attrs, base_cls):
        """
        To create our class we use type() to generate a new class that we 
        return as an object from __new__. __new__() is called before __init__() to 
        create an object of the expected type.
        """
        #first some basic checks
        if len(bases) < 1:
            raise ValueError(
                "%sAdminForm requires a base class" % clsname
            )
        
        # todo: change this to a ref to the class
        assert issubclass(bases[0], base_cls)

        form_meta = '%sAdminModelFormMeta' % (clsname)
        class_meta = type(form_meta,
            (object,),
            {'model':bases[0]}
        )
        class_dict = dict({'Meta':class_meta})

        #add user overrides (if given)
        class_dict.update(attrs)
        model_form = type(
            bases[0].__name__ + 'ModelForm',
            (_ModelFormTemplate,),
            class_dict
        )
        return model_form


class GenericModelAdminMeta(type):
    """More ``type()`` magic here, this time for the ModelAdmin class"""
    def __new__(cls, clsname, bases, attrs, base_cls):
        if len(bases) < 1:
            raise ValueError(
                "%sAdminForm requires a base class" % (clsname)
            )
        #django ModelAdmin classes are required to have a Meta member class with 
        #a 'model' attribute that points to the model type
        type_name = "%sAdminModelAdminMeta" % (clsname)
        class_meta = type(type_name,
            (object,),
            {'model':bases[0]}
        )
        class_dict = dict({'Meta':class_meta})

        #we want all our generic form behaviours to be inherited as well, 
        #so add these to the attribute dict.
        class_dict['form'] = _GenericModelFormMeta(clsname, bases, attrs, base_cls)
        class_dict.update(attrs)
        #use type to create the class
        model_admin = type(
            bases[0].__name__ + 'ModelAdmin',
            (_ModelAdminTemplate,),
            class_dict
        )      
        return model_admin


def register_all_subclass_models(cls, mixins=None, **attr_dict):
    if mixins is None:
        mixins = ()
    #type() doesn't like lists, only tuples
    mixins = tuple(mixins)

    #all new-style classes (those that inherit from object have the __subclasses__ 
    #method that returns...a list of subclasses!
    classes =  cls.__subclasses__()
    model_admins = [
        GenericModelAdminMeta(x.__name__, (x,) + mixins, attr_dict, cls)
        for x in classes
    ]

    for x, y in zip(classes, model_admins):
        admin.site.register(x, y)
