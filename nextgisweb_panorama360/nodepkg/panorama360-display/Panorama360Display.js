import { Button, Image, Modal } from "@nextgisweb/gui/antd";
import { useRef, useEffect, useLayoutEffect, useState, useMemo } from "react";
import i18n from "@nextgisweb/pyramid/i18n!gui";
import showModal from "@nextgisweb/gui/showModal";
import PanoramaIcon from "@material-icons/svg/panorama_photosphere/baseline.svg";
import { route } from "@nextgisweb/pyramid/api";
import "pannellum"

import "./Panorama360Modal.less"
import "pannellum/build/pannellum.css"




const PannellumModal = ({ url, startPoint, points, ...props }) => {
    const changeUrl = (event, handlerArgs) => {
        console.log(handlerArgs);
    }
    const [url_, setUrl_] = useState(url);
    console.log(url_, url);

    const getYaw = (startPoint, endPoint) => {
        const pattern = /-?\d+(\.\d+)?/g;
        const [startLong, startLat] = startPoint.match(pattern).map((x) => parseInt(x));
        const [endLong, endLat] = endPoint.match(pattern).map((x) => parseInt(x));
        const yawRad = Math.atan2(endLong - startLong, endLat - startLat);
        return (yawRad * 180 / Math.PI + 360) % 360;
    };
    
    const generateHotspots = (startPoint, points) => {
        console.log(startPoint);
        var hotspots = [];
        for (const point of points) {
            const hotspot = {};
            hotspot["yaw"] = getYaw(startPoint, point.geom);
            hotspot["pitch"] = 0;
            hotspot["type"] = "info";
            hotspot["clickHandlerFunc"] = setUrl_;
            hotspot["clickHandlerArgs"] = point.fields.panorama_url;
            hotspots.push(hotspot);
        }
        return hotspots;
    };



    const pannellumWrapper = useRef(null);

    useLayoutEffect(() => {
        const hotspots = generateHotspots(startPoint, points);
        pannellumWrapper.current = window.pannellum.viewer(pannellumWrapper.current, {
            autoLoad: true,
            type: "equirectangular",
            panorama: url_,
            hotSpots: hotspots


        });
        return () => {
            pannellumWrapper.current.destroy()
        }
    }, [url_]);

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

export const Panorama360Display = ({ url, featureId, layerId }) => {

    const [startPoint, setStartPoint] = useState(null);
    const [points, setPoints] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const getPoints = async () => {

            const feature = await route("feature_layer.feature.item", {
                id: layerId,
                fid: featureId
            }).get({
                signal: controller.signal,
                cache: true
            });
            setStartPoint(sp => feature.geom);
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
        getPoints();


        return () => {
            controller.abort()
        }

    }, [])
    console.log(typeof points);
    console.log(Array.isArray(points));
    console.log(points, startPoint);


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
                if (points && startPoint) {
                    const modal = showModal(PannellumModal, {
                        url,
                        startPoint,
                        points,
                        onCancel: e => {
                            modal.destroy();
                        }
                    })
                }
            }}
        >
        </Image>
    </div>)
};
