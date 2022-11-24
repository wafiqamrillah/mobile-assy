import axios from "axios";

export default function useWorkOrder() {
    const findFinishGoodWorkOrder = async (number) => {
        return await axios.get(
            `http://msi-ps.test/api/workorder/find_finish_good/${number}`
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
            `http://msi-ps.test/api/workorder/find_semi_finish_good/${number}`
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

        const partFinishGood = await axios.get(`http://msi-ps.test/api/part/find_by_idabas/${workOrderFG.idabas}`)
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

    const getSFGOutstandingLabels = async (workOrderSFGNumber) => {
        return await axios
            .get(
                `http://msi-ps.test/api/datalabel/get_sfg_outstanding_label_by_wo/${workOrderSFGNumber}`
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
                `http://msi-ps.test/api/workorder/adjust_qty`, form
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
    
    return {
        findFinishGoodWorkOrder,
        findSemiFinishGoodWorkOrder,
        checkCompabilityWorkOrder,
        getSFGOutstandingLabels,
        adjustQuantity
    };
}