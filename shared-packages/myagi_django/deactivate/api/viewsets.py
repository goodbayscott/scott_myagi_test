from rest_framework.decorators import detail_route


class DeactivateViewSetMixin(object):

    @detail_route(methods=['post'])
    def deactivate(self, request, pk):
        obj = self.get_object()
        obj.deactivate()
        return self.retrieve(request)
