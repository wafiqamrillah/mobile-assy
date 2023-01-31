import axios from "axios";
import { useRouter } from 'next/router';

export default function useWorkOrder() {
    const router = useRouter();

    const findABASWorkOrder = async (number) => {
        return await axios.get(
            `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/workorder/find_abas_work_order/${number}`
        )
        .then(res => res.data)
        .catch(err => {
            if (err.response?.status == 404) {
                throw new Error("Data tidak ditemukan.");
            } else {
                throw err;
            }
        });
    }

    const findFinishGoodWorkOrder = async (number) => {
        return await axios.get(
            `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/workorder/find_finish_good/${number}`
        )
        .then(res => res.data)
        .catch(err => {
            if (err.response?.status == 404) {
                throw new Error("Data tidak ditemukan atau bukan work order finish good.");
            } else {
                throw err;
            }
        });
    }

    const findSemiFinishGoodWorkOrder = async (number) => {
        return await axios.get(
            `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/workorder/find_semi_finish_good/${number}`
        )
        .then(res => res.data)
        .catch(err => {
            if (err.response?.status == 404) {
                throw new Error("Data tidak ditemukan atau bukan work order semi finish good.");
            } else {
                throw err;
            }
        });
    }

    const checkCompabilityWorkOrder = async (workOrderFG, workOrderSFG) => {
        if (!workOrderFG.id) {
            throw new Error('Tidak ada data work order finish good yang diperiksa');
        }

        if (!workOrderSFG.id) {
            throw new Error('Tidak ada data work order semi finish good yang diperiksa');
        }
        
        if (!workOrderFG.idabas) {
            throw new Error('Tidak ada data part finish good yang diperiksa');
        }
        
        if (!workOrderSFG.idabas) {
            throw new Error('Tidak ada data part semi finish good yang diperiksa');
        }

        const partFinishGood = await axios.get(`${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/part/find_by_idabas/${workOrderFG.idabas}`)
            .then(res => res.data)
            .catch(err => {
                if (err.response?.status == 404) {
                    throw new Error("Data part finish good tidak ditemukan.");
                } else {
                    throw err;
                }
            });
        
        return partFinishGood.idabas_s == workOrderSFG.idabas;
    }

    const createCompletionConfirmationWorkOrder = async (number) => {
        return await axios.get(
            `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/workorder/create_completion_confirmation/${number}`
        )
        .then(res => res.data)
        .catch(err => {
            if (err.response?.status == 404) {
                throw new Error("Data tidak ditemukan.");
            } else {
                throw err;
            }
        });
    }

    const getSFGOutstandingLabels = async (workOrderSFGNumber) => {
        return await axios
            .get(
                `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/datalabel/get_sfg_outstanding_label_by_wo/${workOrderSFGNumber}`
            )
            .then(res => res.data)
            .catch(err => {
                if (err.response?.status == 404) {
                    throw new Error("Data tidak ditemukan atau bukan work order semi finish good.");
                } else {
                    throw err;
                }
            });
    }

    const adjustQuantity = async (workOrderFG, workOrderSFG, form) => {
        form.work_order_finish_good_number = workOrderFG.number;
        form.work_order_semi_finish_good_number = workOrderSFG.number;

        return await axios
            .post(
                `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/workorder/adjust_qty`, form
            )
            .then(res => {
                const response = res.data;

                if (!response.status) throw new Error('There is no response data status from server.');
                if (response.status !== 'success') throw new Error(response.message ?? 'Proses input gagal'); 

                return res.data;
            })
            .catch(err => {
                throw new Error(err.response?.statusText ?? err.message);
            });
    }

    const getAllNGClassifications = async() => {
        return await axios
            .get(
                `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/ngclassifications/get_all`
            )
            .then(res => res.data)
            .catch(err => {
                if (err.response?.status == 404) {
                    throw new Error("Data tidak ditemukan atau bukan work order semi finish good.");
                } else {
                    throw err;
                }
            })
    }

    const getAllWorkCentres = async() => {
        return await axios
            .get(
                `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/workcentre/get`
            )
            .then(res => res.data)
            .catch(err => {
                if (err.response?.status == 404) {
                    throw new Error("Data tidak ditemukan atau bukan work order semi finish good.");
                } else {
                    throw err;
                }
            })
    }

    const getPullListsByWorkOrderNumber = async(workOrderNumber) => {
        return await axios
            .get(
                `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/pulllist/get_pull_lists_by_wo/${workOrderNumber}`
            )
            .then(res => res.data)
            .catch(err => {
                if (err.response?.status == 404) {
                    throw new Error("Data tidak ditemukan.");
                } else {
                    throw err;
                }
            })
    }
    
    const submitPullList = async (workOrder, form) => {
        form.work_order_number = workOrder.number;

        return await axios
            .post(
                `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/pulllist/store`, form
            )
            .then(res => {
                const response = res.data;

                if (!response.status) throw new Error('There is no response data status from server.');
                if (response.status !== 'success') throw new Error(response.message ?? 'Proses input gagal'); 

                return res.data;
            })
            .catch(err => {
                throw new Error(err.response?.statusText ?? err.message);
            });
    }
    
    const submitAbasPullList = async (workOrder, form) => {
        form.work_order_number = workOrder.number;

        // If there is no work order number, then show error
        if (!form.work_order_number) throw new Error("Data input tidak valid. Tidak ada nomor work order.");
        // If there is no production date and time inputted, then show error
        // if (!form.production_date || !form.production_time) throw new Error("Data input tidak valid. Tidak ada tanggal atau shift produksi yang dimasukkan.");
        if (!form.production_date || !form.shift) throw new Error("Data input tidak valid. Tidak ada tanggal atau shift produksi yang dimasukkan.");

        let success_responses = [];
        let error_responses = [];

        let good_qty = 0, ng_qty = 0, ng_classifications = [];
        good_qty = form.good_qty ?? good_qty;
        ng_qty = form.ng_qty ?? ng_qty;
        ng_classifications = form.ng_classifications ?? ng_classifications;

        // If there is no quantity inputted, then show error
        if (good_qty + ng_qty <= 0) throw new Error("Data input tidak valid. Tidak ada quantity yang dimasukkan.");

        // If there is NG quantity, but there is no NG Classification inputted, then show error
        if (ng_qty > 0 && ng_classifications.length <= 0) throw new Error("Data input tidak valid. Klasifikasi NG tidak dimasukkan.");

        let requests = [];

        if (ng_qty > 0 && ng_classifications.length > 0) {
            ng_classifications.forEach(function(classification) {
                requests.push({
                    'wo_number' : form.work_order.number,
                    'wo_number_completion' : `${form.work_order.number}001`,
                    'work_order' : form.work_order,
                    'work_centre' : form.work_centre,
                    'part' : form.work_order.part,
                    'production_date' : form.production_date,
                    // 'production_time' : form.production_time,
                    'shift' : form.shift,
                    'good_qty' : 0,
                    'ng_qty' : classification.qty,
                    'reason' : classification.ng_code,
                });
            });
        }

        if (good_qty > 0) {
            requests.push({
                'wo_number' : form.work_order.number,
                'wo_number_completion' : `${form.work_order.number}001`,
                'work_order' : form.work_order,
                'work_centre' : form.work_centre,
                'part' : form.work_order.part,
                'production_date' : form.production_date,
                // 'production_time' : form.production_time,
                'shift' : form.shift,
                'good_qty' : good_qty,
                'ng_qty' : 0,
                'reason' : null,
            });
        }
        
        // If there is no request generated, then show error
        if (requests.length <= 0) throw new Error("Data tidak valid. Tidak ada data yang diproses ke ABAS.");

        for (const request of requests) {
            try {
                const response = await axios
                    .post(
                        `${(router.basePath ?? 'http://192.168.0.235:8080/msi-ps-new').replace('mobile-assy', 'msi-ps-new')}/api/pulllist/abas_store`, request
                    )
                    .then(res => res.data)
                    .catch(err => {
                        throw new Error(err.response?.statusText ?? err.message);
                    });

                if (!response.status) throw new Error('There is no response data status from server.');
                if (response.status !== 'success') throw new Error(response.message ?? 'Proses input gagal'); 

                success_responses.push(response);
            } catch (error) {
                error_responses.push(error.message);
            }
        }

        return {
            success : success_responses,
            error : error_responses
        };
    }
    
    return {
        findABASWorkOrder,
        findFinishGoodWorkOrder,
        findSemiFinishGoodWorkOrder,
        checkCompabilityWorkOrder,
        createCompletionConfirmationWorkOrder,
        getSFGOutstandingLabels,
        adjustQuantity,
        getAllNGClassifications,
        getAllWorkCentres,
        getPullListsByWorkOrderNumber,
        submitPullList,
        submitAbasPullList
    };
}