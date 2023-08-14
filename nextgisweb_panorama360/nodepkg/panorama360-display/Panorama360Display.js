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





const PhotosphereModal = ({ startPoint, points, panoramaField, setFid, ...props }) => {


    const getCoords = (point) => {
        const pattern = /-?\d+(\.\d+)?/g;
        const [long, lat] = point.match(pattern).map(x => parseFloat(x));
        return [long, lat]
    }

    // nodes are connected in a tree with one startNode and other child nodes
    const generateNodes = (startPoint, points) => {
        console.log(startPoint);
        var nodes = [];
        var nodeIds = []
        for (const point of points) {
            const node = {};
            node['id'] = point.id;
            node['panorama'] = point.fields[panoramaField];
            node['gps'] = getCoords(point.geom);
            node['links'] = [{nodeId: startPoint.id}];
            nodeIds.push({nodeId: point.id});
            nodes.push(node);
        }
        const startNode = {};
        startNode['id'] = startPoint.id;
        startNode['panorama'] = startPoint.fields[panoramaField];
        startNode['gps'] = getCoords(startPoint.geom);
        startNode['links'] = nodeIds;
        nodes.push(startNode);
        return nodes;
    };



    const photosphereWrapper = useRef(null);
    useEffect(() => {
        console.log("rendering");
        console.log(startPoint)
        photosphereWrapper.current = new Viewer({
            container: "photosphereContainer",
            panorama: startPoint.fields[panoramaField],
            size: { height: "inherit", width: "inherit" },
            plugins: [
                CompassPlugin,
                MarkersPlugin,
                [VirtualTourPlugin, {
                    positionMode: "gps",
                    renderMode: "3d",
                }]

            ]


        });

        const virtualTour = photosphereWrapper.current.getPlugin(VirtualTourPlugin);


        virtualTour.setNodes(generateNodes(startPoint, points), startPoint.id);

        virtualTour.addEventListener("node-changed", ({node, data}) => {
            console.log(node, data.fromNode);
            setFid(node.id);
            console.log(startPoint)
        });


            // return () => {
            //     photosphereWrapper.current.destroy()
            // }
    }, [startPoint])






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

    const [startPoint, setStartPoint] = useState(null);
    const [points, setPoints] = useState(null);
    const [fid, setFid] = useState(featureId);



    useEffect(() => {
        const controller = new AbortController();
        const getPoints = async () => {
            console.log("getting points");

            const feature = await route("feature_layer.feature.item", {
                id: layerId,
                fid: fid
            }).get({
                signal: controller.signal,
                cache: true,
                query: {
                    srs: 4326
                }
            });
            setStartPoint(sp => feature);
            const nearestPoints = await route("feature_layer.feature.collection", {
                id: layerId
            }).get({
                query: {
                    limit: 5,
                    order_by: "distance",
                    distance_geom: feature.geom,
                    distance_srs: 4326,
                    srs: 4326,
                    offset: 1,
                    signal: controller.signal,
                    cache: true
                }
            });
            setPoints(p => nearestPoints);
            console.log(nearestPoints);
        }

        getPoints();


        return () => {
            controller.abort()
        }

    }, [fid])


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
                    startPoint,
                    points,
                    panoramaField,
                    setFid,
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
