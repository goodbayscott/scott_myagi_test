This directory is used to share some component logic between the webapp and our native apps.
In future, we should not really use mixins to share this logic. Instead, it generally makes
more sense to just create a new `utilities` module for the component in question and share logic
that way (i.e. preference composition over inheritance). These mixins should be phased out over time.
