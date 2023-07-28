from nextgisweb.feature_layer import FeatureExtension
from nextgisweb.env import DBSession
from nextgisweb.resource import (
    Resource,
    ResourceScope)
import requests

from .model import Panorama360Webmap
from nextgisweb.pyramid.view import home


class Panorama360Extension(FeatureExtension):
    identity = "panorama360"

    display_widget = "ngw-panorama360/DisplayWidget"


    def serialize(self, feature):
        return self.layer.id, feature.id, feature.fields
        # pass buffer here?

        
    def deserialize(self, feature, data):
        pass