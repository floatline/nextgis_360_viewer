import { Button, Image, Modal } from "@nextgisweb/gui/antd";
import { useRef, useEffect, useLayoutEffect, useState, useMemo } from "react";
import i18n from "@nextgisweb/pyramid/i18n!gui";
import showModal from "@nextgisweb/gui/showModal";
import PanoramaIcon from "@material-icons/svg/panorama_photosphere/baseline.svg";
import { route } from "@nextgisweb/pyramid/api";

import { Viewer } from '@photo-sphere-viewer/core'
import { CompassPlugin } from "@photo-sphere-viewer/compass-plugin"
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin"

import "@photo-sphere-viewer/core/index.css"
import "@photo-sphere-viewer/compass-plugin/index.css"
import "@photo-sphere-viewer/virtual-tour-plugin/index.css"
import "@photo-sphere-viewer/markers-plugin/index.css"



import "./Panorama360Modal.less"
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";





const PhotosphereModal = ({ featureId, layerId, panoramaField, ...props }) => {

    const getCoords = (point) => {
        const pattern = /-?\d+(\.\d+)?/g;
        const [long, lat] = point.match(pattern).map(x => parseFloat(x));
        return [long, lat]
    };

    // nodes are connected in a tree with one startPoint and other child nodes
    const getNode = async (nodeId) => {
        const startPoint = await route("feature_layer.feature.item", {
            id: layerId,
            fid: nodeId
        }).get({
            cache: true,
            query: {
                srs: 4326
            }
        });
        console.log(startPoint);
        // setStartPoint(sp => feature);
        const node = await route("feature_layer.feature.collection", {
            id: layerId
        }).get({
            query: {
                limit: 5,
                order_by: "distance",
                distance_geom: startPoint.geom,
                distance_srs: 4326,
                srs: 4326,
                offset: 1,
                cache: true
            }
        }).then(points => {
            console.log(points)
            const node = {};
            node['id'] = startPoint.id;
            node['panorama'] = startPoint.fields[panoramaField];
            node['gps'] = getCoords(startPoint.geom);
            var links = [];
            for (const point of points) {
                links.push({
                    nodeId: point.id,
                    gps: getCoords(point.geom)
                })
            }
            node['links'] = links;
            return node;
        });
        return node;
    };



    const photosphereWrapper = useRef(null);
    useEffect(() => {
        console.log("rendering");
        photosphereWrapper.current = new Viewer({
            container: "photosphereContainer",
            size: { height: "inherit", width: "inherit" },
            plugins: [
                CompassPlugin,
                MarkersPlugin,
                [VirtualTourPlugin, {
                    positionMode: "gps",
                    renderMode: "3d",
                    dataMode: "server",
                    getNode: getNode,
                    startNodeId: featureId
                }]

            ]


        });




        return () => {
            photosphereWrapper.current.destroy()
        }
    }, [])






    return (
        <Modal
            title={null}
            width="70%"
            height="80%"
            closable={true}
            centered={true}
            footer={null}
            {...props}
        >
            <div
                id="photosphereContainer"
                height="100%"
                width="100%"
                ref={photosphereWrapper}
            >

            </div>
        </Modal >
    )
};

export const Panorama360Display = ({ url, featureId, layerId, panoramaField }) => {


    return (<div className="ngw-panorama360-identify-button"
    >
        <Image
            preview={{
                height: "50%",
                visible: false,
                mask:
                    <div>
                        <PanoramaIcon />
                        <span> {i18n.gettext("View panorama")}</span>
                    </div>
            }}
            src={url}
            height="50%"
            width="100%"
            onClick={() => {
                const modal = showModal(PhotosphereModal, {
                    featureId,
                    layerId,
                    panoramaField,
                    onCancel: e => {
                        modal.destroy();
                    }
                })
            }
            }
        >
        </Image>
    </div>)
};
