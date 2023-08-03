import { Button, Image, Modal } from "@nextgisweb/gui/antd";
import { useRef, useEffect, useLayoutEffect } from "react";
import i18n from "@nextgisweb/pyramid/i18n!gui";
import showModal from "@nextgisweb/gui/showModal";
import PanoramaIcon from "@material-icons/svg/panorama_photosphere/baseline.svg";
import { route } from "@nextgisweb/pyramid/api";
import "pannellum"

import "./Panorama360Modal.less"
import "pannellum/build/pannellum.css"



const PannellumModal = ({ url, ...props }) => {

    const pannellumWrapper = useRef(null);

    useLayoutEffect(() => {
        pannellumWrapper.current = window.pannellum.viewer(pannellumWrapper.current, {
            autoLoad: true,
            type: "equirectangular",
            panorama: url
        });
        return () => {
            pannellumWrapper.current.destroy()
        }
    }, []);

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

    // const radius = 500000;
    // useEffect(
    //     async () => {
    //     const feature = await route("feature_layer.feature.item", {
    //         id: layerId,
    //         fid: featureId
    //     }).get();
    //     const nearestPoints = await route("feature_layer.feature.collection", {
    //         id: layerId
    //     }).get({query: {
    //         limit: 5,
    //         order_by: "distance",
    //         distance_geom: feature.geom,
    //         offset: 1
    //     }});

    //     console.log(nearestPoints);
    // }, [])


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
                    url,
                    onCancel: e => {
                        modal.destroy();
                    }
                })
            }}
        >
        </Image>
    </div>)
};
