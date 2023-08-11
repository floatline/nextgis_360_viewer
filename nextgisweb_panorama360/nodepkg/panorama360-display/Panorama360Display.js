import { Button, Image, Modal } from "@nextgisweb/gui/antd";
import { useRef, useEffect, useLayoutEffect, useState, useMemo } from "react";
import i18n from "@nextgisweb/pyramid/i18n!gui";
import showModal from "@nextgisweb/gui/showModal";
import PanoramaIcon from "@material-icons/svg/panorama_photosphere/baseline.svg";
import { route } from "@nextgisweb/pyramid/api";

import {Viewer} from '@photo-sphere-viewer/core'

import "pannellum"

import "./Panorama360Modal.less"
import "pannellum/build/pannellum.css"




const PannellumModal = ({ startPoint, points, panoramaField, setFid, ...props }) => {

    const clickedOn = (event, handlerArgs) => {
        setFid(handlerArgs);
        console.log(handlerArgs);
    }

    const getYaw = (startPoint, endPoint) => {
        const pattern = /-?\d+(\.\d+)?/g;
        const [startLong, startLat] = startPoint.match(pattern).map(x => parseInt(x));
        const [endLong, endLat] = endPoint.match(pattern).map(x => parseInt(x));
        const yawRad = Math.atan2(endLong - startLong, endLat - startLat);
        return (yawRad * 180 / Math.PI + 360) % 360;
    };

    const generateHotspots = (startPoint, points) => {
        console.log(startPoint);
        var hotspots = [];
        for (const point of points) {
            const hotspot = {};
            hotspot["yaw"] = getYaw(startPoint.geom, point.geom);
            hotspot["pitch"] = 0;
            hotspot["type"] = "info";
            //hotspot["sceneId"] = point.id;
            hotspot["clickHandlerArgs"] = point.id;
            hotspot["clickHandlerFunction"] = clickedOn;
            hotspots.push(hotspot);
        }
        return hotspots;
    };


    console.log("component is rendering");
    const pannellumWrapper = useRef(null);
    useLayoutEffect(() => {
        const hotspots = generateHotspots(startPoint, points);

        if (!(pannellumWrapper.current instanceof window.pannellum.viewer)) {
            pannellumWrapper.current = window.pannellum.viewer(pannellumWrapper.current, {
                default: {
                    firstScene: startPoint.id,
                    autoload: true
                },
                scenes: {
                    [startPoint.id]: {
                        autoload: true,
                        panorama: startPoint.fields[panoramaField],
                        type: "equirectangular",
                        hotSpots: hotspots
                    },
                }
            })
        }

        else {
            var scene = {
                [startPoint]: {
                    autoload: true,
                    panorama: startPoint.fields[panoramaField],
                    type: "equirectangular",
                    hotSpots: hotspots
                }
            }
            console.log(scene)
            pannellumWrapper.current.addScene(scene);
            pannellumWrapper.current.loadScene(startPoint.id);
            //pannellumWrapper.current.removeScene(oldSceneId);
            // pannellumWrapper.current.on("scenechange", clickedOn)
            console.log(startPoint)
        }





        return () => {
            pannellumWrapper.current.destroy()
        }
    }, [startPoint]);


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
                height="100%"
                width="fit-content"
                ref={pannellumWrapper}
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
                cache: true
            });
            setStartPoint(sp => feature);
            const nearestPoints = await route("feature_layer.feature.collection", {
                id: layerId
            }).get({
                query: {
                    limit: 5,
                    order_by: "distance",
                    distance_geom: feature.geom,
                    offset: 1,
                    signal: controller.signal,
                    cache: true
                }
            });
            setPoints(p => nearestPoints);
            console.log(nearestPoints);
        }

        getPoints(controller);


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
                const modal = showModal(PannellumModal, {
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
