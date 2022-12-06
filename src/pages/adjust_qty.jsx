import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faCheckCircle, faTimesCircle, faSearch } from '@fortawesome/free-solid-svg-icons';

// Components
import AppLayout from '@/components/layouts/AppLayout';
import Navbar from '@/components/layouts/Navbar';

// Hooks
import useWorkOrder from '@/hooks/useWorkOrder';

export default function AdjustQty() {
    // State
    const [isLoading, setIsLoading] = useState(false);
    const [isScanWoFG, setIsScanWoFG] = useState(true);
    const [isScanWoSFG, setIsScanWoSFG] = useState(true);
    const [isShowAdjustmentModal, setIsShowAdjustmentModal] = useState(false);
    const [scanStatus, setScanStatus] = useState("scan_wo_fg"); // {scan_wo_fg, scan_wo_sfg, input_adjustment}

    // Addons
    const FireSwal = withReactContent(Swal);

    // Props
    const [workOrderFG, setWorkOrderFG] = useState({});
    const [workOrderSFG, setWorkOrderSFG] = useState({});
    const [inputAdjustmentQty, setInputAdjustmentQty] = useState(0);
    const [sfgOutstandingLabelQty, setSfgOutstandingLabelQty] = useState(0);
    const [maximumQty, setMaximumQty] = useState(0);

    // References
    const qrCodeInputEl = useRef(null);
    const workOrderFGNumberEl = useRef(null);
    const workOrderSFGNumberEl = useRef(null);
    const adjustmentQtyEl = useRef(0);
    const lineNumberEl = useRef(null);

    // Hooks
    const WorkOrder = useWorkOrder();

    useEffect(() => {
        setIsScanWoFG(!workOrderFG?.number);
        setIsScanWoSFG(!workOrderSFG?.number);
        setScanStatus(!workOrderFG?.number ? 'scan_wo_fg' : (!workOrderSFG?.number ? 'scan_wo_sfg' : 'input_adjustment'));

        if (workOrderFG.id && workOrderSFG.id && scanStatus !== "input_adjustment") {
            (
                async() => {
                    const isCompatiblePart = await WorkOrder.checkCompabilityWorkOrder(workOrderFG, workOrderSFG)
                        .catch(error => {
                            setWorkOrderSFG({});
                            throw error;
                        });
                    
                    if (!isCompatiblePart) {
                        setWorkOrderSFG({});
        
                        throw new Error("Work order tidak sesuai");
                    }
        
                    const currentSFGOutstandingLabels = await WorkOrder.getSFGOutstandingLabels(workOrderSFG.number);
                    const currentOutstandingLabelQty = currentSFGOutstandingLabels.length + workOrderSFG.outstanding_qty;
                    
                    setSfgOutstandingLabelQty(currentOutstandingLabelQty);
                    setMaximumQty(workOrderFG.outstanding_qty > currentOutstandingLabelQty ? currentOutstandingLabelQty : workOrderFG.outstanding_qty);
                }
            )()
                .catch(err => {
                    return FireSwal.fire({
                        icon: 'error',
                        title: <strong>Error</strong>,
                        html: <span>{ err.response?.statusText ?? err.message ?? 'Terjadi kesalahan. Silahkan lapor ke bagian IT!' }</span>,
                        showConfirmButton: false,
                        timer: 3000
                    });
                });
        }

        return () => {
        };
    }, [workOrderFG, workOrderSFG, isScanWoFG, isScanWoSFG, sfgOutstandingLabelQty, maximumQty]);

    const handleKeyDownWorkOrderInputEl = (e) => {
        if (e?.code === "Enter") {
            submitScan();
        }
    }

    const openAdjustmentModal = () => {
        setInputAdjustmentQty(adjustmentQtyEl.current.value);
        setIsShowAdjustmentModal(true);
    }

    const confirmAdjustmentQtyEvent = () => {
        adjustmentQtyEl.current.value = inputAdjustmentQty;

        closeAdjustmentModal();
    }

    const closeAdjustmentModal = () => {
        setIsShowAdjustmentModal(false);
    }

    const handleAdjustmentQtyChangeEvent = (number) => {
        let currentNumbers = typeof inputAdjustmentQty !== 'string' ? inputAdjustmentQty.toString() : inputAdjustmentQty;

        if (currentNumbers == 0) {
            currentNumbers = number;
        } else {
            currentNumbers += number;
        }

        if (parseInt(currentNumbers) > maximumQty ) {
            currentNumbers = maximumQty;
        }

        setInputAdjustmentQty(currentNumbers);
    }

    const clearAdjustmentQtyEvent = () => {
        let currentNumbers = typeof inputAdjustmentQty !== 'string' ? inputAdjustmentQty.toString() : inputAdjustmentQty;

        currentNumbers = currentNumbers.split('');
        currentNumbers.pop();

        currentNumbers = currentNumbers.length > 0 ? currentNumbers.join('') : 0;

        setInputAdjustmentQty(currentNumbers);
    }

    const openConfirmationModal = () => {
        FireSwal.mixin({
            customClass: {
                confirmButton: 'px-6 py-2 bg-green-600 hover:bg-green-400 focus:bg-green-800 disabled:bg-green-300 rounded-lg text-white',
                cancelButton: 'px-6 py-2 bg-red-600 hover:bg-red-400 focus:bg-red-800 disabled:bg-red-300 rounded-lg text-white'
            },
            buttonsStyling: false
        }).fire({
            title: 'Konfirmasi',
            text: "Anda akan mengubah quantity data work order. Anda yakin?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya',
            cancelButtonText: 'Tidak'
        }).then((result) => {
            if (result.isConfirmed) {
                submitAdjustmentForm();
            }
        });
    }

    const submitAdjustmentForm = () => {
        try {
            const adjustmentQty = typeof (adjustmentQtyEl.current?.value ?? 0) === "numeric" ? adjustmentQtyEl.current?.value ?? 0 : parseInt(adjustmentQtyEl.current?.value);

            if (adjustmentQty <= 0) {
                throw new Error("Nilai adjustment qty tidak valid");
            } else if(adjustmentQty > maximumQty) {
                throw new Error("Nilai adjustment qty melebihi outstanding qty");
            }

            const lineNumber = lineNumberEl.current?.value;

            if (!lineNumber || lineNumber === '') {
                throw new Error("Nomor line harus diisi");
            }

            (async () => {
                setIsLoading(true);

                if (!workOrderFG.id) {
                    setWorkOrderFG({});
                    throw new Error("Data work order finish good tidak valid. Mohon scan kembali data work order finish good.");
                }

                if (!workOrderSFG.id) {
                    setWorkOrderSFG({});
                    throw new Error("Data work order semi finish good tidak valid. Mohon scan kembali data work order semi finish good.");
                }

                const form = {
                    'adjustment_qty' : adjustmentQty,
                    'line_number'    : lineNumber
                };
                
                const processResponse = await WorkOrder.adjustQuantity(workOrderFG, workOrderSFG, form);

                FireSwal.fire({
                    icon: 'success',
                    title: <strong>Success</strong>,
                    html: <span>{ processResponse.message ?? "Data berhasil dibuat" }</span>,
                    timer: 5000
                });

                return resetForm();
            })()
                .catch(err => {
                    FireSwal.fire({
                        icon: 'error',
                        title: <strong>Error</strong>,
                        html: <span>{ err.message }</span>,
                        showConfirmButton: false,
                        timer: 3000
                    });
                })
                .finally(() => setIsLoading(false));
        } catch (error) {
            FireSwal.fire({
                icon: 'error',
                title: <strong>Error</strong>,
                html: <span>{ error.message }</span>,
                showConfirmButton: false,
                timer: 3000
            });
        }
    }

    const resetForm = () => {
        adjustmentQtyEl.current.value = 0;
        lineNumberEl.current.value = null;
        setInputAdjustmentQty(0);
        setWorkOrderFG({});
        setWorkOrderSFG({});
        setSfgOutstandingLabelQty(0);
        setMaximumQty(0);
    }

    const submitScan = () => {
        (async () => {
            setIsLoading(true);

            let result;

            switch (scanStatus) {
                case 'scan_wo_fg':
                    const wo_fg_number = workOrderFGNumberEl.current?.value;
                    if (!wo_fg_number) throw new Error("Nomor work order finish good tidak valid!");

                    result = await WorkOrder.findFinishGoodWorkOrder(wo_fg_number);

                    if (result) {
                        workOrderFGNumberEl.current.value = result.number;
                        setWorkOrderFG(result);
                    }
                    break;
                case 'scan_wo_sfg':
                    const wo_sfg_number = workOrderSFGNumberEl.current?.value;
                    if (!wo_sfg_number) throw new Error("Nomor work order semi finish good tidak valid!");

                    result = await WorkOrder.findSemiFinishGoodWorkOrder(wo_sfg_number);

                    if (result) {
                        workOrderSFGNumberEl.current.value = result.number;
                        setWorkOrderSFG(result);
                    }
                    break;
                default:
                    break;
            }

            if (!result) {
                throw new Error("Data tidak ditemukan.");
            }
        })()
            .catch(err => {
                if (err.response?.status == 404) {
                    return FireSwal.fire({
                        icon: 'error',
                        title: <strong>Error</strong>,
                        html: <span>Data tidak ditemukan</span>,
                        showConfirmButton: false,
                        timer: 3000
                    });
                }

                return FireSwal.fire({
                    icon: 'error',
                    title: <strong>Error</strong>,
                    html: <span>{ err.response?.statusText ?? err.message ?? 'Terjadi kesalahan. Silahkan lapor ke bagian IT!' }</span>,
                    showConfirmButton: false,
                    timer: 3000
                });
            })
            .finally(() => setIsLoading(false));
    }

    return (
        <AppLayout
            isLoading={ isLoading }>
            <Navbar />
            
            <div className="relative pt-20">
                <div className="relative m-1 flex flex-col space-y-3">
                    {/* Work Order Finish Good Card */}
                    <div className="relative p-2 bg-gray-100 border border-gray-400 text-black rounded-lg">
                        {/* Header */}
                        <div className="mb-2">
                            <span className="text-xs font-extrabold uppercase">
                                Work Order Finish Good
                            </span>
                            <hr className="h-[2px] bg-gray-400 rounded-sm" />
                        </div>

                        {/* Identity */}
                        <div className="flex flex-col space-y-2">
                            <div className="grid grid-cols-12 items-center">
                                <label
                                    htmlFor="work_order_fg_number"
                                    className="col-span-4 text-sm font-bold">
                                    Number
                                </label>
                                <input
                                    ref={ workOrderFGNumberEl }
                                    type="text"
                                    className="p-1 col-span-4 text-right text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_fg_number"
                                    disabled={ !isScanWoFG }
                                    onKeyDown={ handleKeyDownWorkOrderInputEl } />
                                <button
                                    type="button"
                                    className="col-span-1 ml-1 p-1 text-white text-sm bg-blue-600 hover:bg-blue-400 disabled:bg-blue-300 border border-blue-700 disabled:border-blue-300 rounded-lg"
                                    disabled={ !isScanWoFG }
                                    onClick={ () => submitScan() }>
                                    <FontAwesomeIcon icon={ faSearch }/>
                                </button>
                            </div>
                            <div className="grid grid-cols-12 items-center">
                                <label
                                    htmlFor="work_order_fg_part_name"
                                    className="col-span-4 text-sm font-bold">
                                    Part Name
                                </label>
                                <input
                                    type="text"
                                    className="p-1 col-span-8 text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_fg_part_name"
                                    value={ workOrderFG?.partdesc || '' }
                                    readOnly />
                            </div>
                            <div className="grid grid-cols-12 items-center">
                                <label
                                    htmlFor="work_order_fg_order_qty"
                                    className="col-span-4 text-sm font-bold">
                                    WO Qty
                                </label>
                                <input
                                    type="number"
                                    className="p-1 col-span-4 text-sm text-right bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_fg_order_qty"
                                    value={ workOrderFG?.order_qty ?? 0 }
                                    readOnly />
                            </div>
                            <div className="grid grid-cols-12 items-center">
                                <label
                                    htmlFor="work_order_fg_outstanding_qty"
                                    className="col-span-4 text-sm font-bold">
                                    Outstanding Qty
                                </label>
                                <input
                                    type="number"
                                    className="p-1 col-span-4 text-sm text-right bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_fg_outstanding_qty"
                                    value={ workOrderFG?.outstanding_qty ?? 0 }
                                    readOnly />
                            </div>
                        </div>
                    </div>
                    
                    <hr className="h-[2px] bg-gray-400 rounded-sm" />

                    <span className="text-lg font-semibold uppercase">
                        Adjustment
                    </span>

                    {/* Work Order Semi Finish Good Card */}
                    <div className="relative p-2 bg-gray-100 border border-gray-400 text-black rounded-lg">
                        {/* Header */}
                        <div className="mb-2">
                            <span className="text-xs font-extrabold uppercase">
                                Work Order Semi-Finish Good
                            </span>
                            <hr className="h-[2px] bg-gray-400 rounded-sm" />
                        </div>

                        {/* Identity */}
                        <div className="flex flex-col space-y-2">
                            <div className="grid grid-cols-12 items-center">
                                <label
                                    htmlFor="work_order_sfg_number"
                                    className="col-span-4 text-sm font-bold">
                                    Number
                                </label>
                                <input
                                    ref={ workOrderSFGNumberEl }
                                    type="text"
                                    className="p-1 col-span-4 text-sm text-right bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_sfg_number"
                                    disabled={ !(isScanWoSFG && !isScanWoFG) }
                                    onKeyDown={ handleKeyDownWorkOrderInputEl } />
                                <button
                                    type="button"
                                    className="col-span-1 ml-1 p-1 text-white text-sm bg-blue-600 hover:bg-blue-400 disabled:bg-blue-300 border border-blue-700 disabled:border-blue-300 rounded-lg"
                                    disabled={ !(isScanWoSFG && !isScanWoFG) }
                                    onClick={ () => submitScan() }>
                                    <FontAwesomeIcon icon={ faSearch }/>
                                </button>
                            </div>
                            <div className="grid grid-cols-12 items-center">
                                <label
                                    htmlFor="work_order_sfg_part_name"
                                    className="col-span-4 text-sm font-bold">
                                    Part Name
                                </label>
                                <input
                                    type="text"
                                    className="p-1 col-span-8 text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_sfg_part_name"
                                    value={ workOrderSFG?.partdesc || '' }
                                    readOnly />
                            </div>
                            <div className="grid grid-cols-12 items-center">
                                <label
                                    htmlFor="work_order_sfg_wo_qty"
                                    className="col-span-4 text-sm font-bold">
                                    WO Qty
                                </label>
                                <input
                                    type="number"
                                    className="p-1 col-span-4 text-sm text-right bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_sfg_wo_qty"
                                    value={ workOrderSFG?.order_qty ?? 0 }
                                    readOnly />
                            </div>
                            <div className="grid grid-cols-12 items-center">
                                <label
                                    htmlFor="work_order_sfg_outstanding_qty"
                                    className="col-span-4 text-sm font-bold">
                                    Outstanding Qty
                                </label>
                                <input
                                    type="number"
                                    className="p-1 col-span-4 text-sm text-right bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_sfg_outstanding_qty"
                                    value={ workOrderSFG?.outstanding_qty ?? 0 }
                                    readOnly />
                            </div>
                        </div>
                    </div>

                    {/* Adjustment Card */}
                    <div className="relative p-2 bg-gray-100 border border-gray-400 text-black rounded-lg">
                        {/* Header */}
                        <div className="mb-2">
                            <span className="text-xs font-extrabold uppercase">
                                Adjustment
                            </span>
                            <hr className="h-[2px] bg-gray-400 rounded-sm" />
                        </div>

                        {/* Identity */}
                        <div className="flex flex-col space-y-2">
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="result_qty"
                                    className="w-1/3 text-sm font-bold">
                                    Label SFG Outstanding Qty
                                </label>
                                <input
                                    type="number"
                                    className="p-1 w-32 text-right text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                    name="result_qty"
                                    value={ sfgOutstandingLabelQty }
                                    readOnly />
                            </div>
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="adjustment_qty"
                                    className="w-1/3 text-sm font-bold">
                                    Line
                                </label>
                                <select
                                    ref={ lineNumberEl }
                                    name="line_number"
                                    defaultValue={ null }
                                    className="p-1 w-32 text-center text-sm bg-blue-200 disabled:bg-gray-300 border-2 disabled:border border-blue-400 disabled:border-gray-400 rounded-lg focus:outline-none"
                                    disabled={ isScanWoFG && isScanWoSFG }>
                                        <option value={ '' }>--Pilih Line--</option>
                                        <option value={ 1 }>1</option>
                                        <option value={ 2 }>2</option>
                                </select>
                            </div>
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="adjustment_qty"
                                    className="w-1/3 text-sm font-bold">
                                    Adjustment Qty
                                </label>
                                <div className="w-2/3 flex items-center space-x-2">
                                    <input
                                        ref={ adjustmentQtyEl }
                                        type="number"
                                        className="w-3/6 p-1 text-right text-sm hover:cursor-pointer bg-blue-200 disabled:bg-gray-300 border-2 disabled:border border-blue-400 disabled:border-gray-400 rounded-lg focus:outline-none"
                                        name="adjustment_qty"
                                        defaultValue={ 0 }
                                        disabled={ isScanWoFG && isScanWoSFG }
                                        readOnly={ !isScanWoFG && !isScanWoSFG }
                                        onClick={ (e) => {
                                            if (!isScanWoFG && !isScanWoSFG) {
                                                openAdjustmentModal();
                                            }
                                        } } />
                                    
                                    <div className="flex-auto text-center">
                                        /
                                    </div>

                                    <input
                                        type="number"
                                        className="w-3/6 p-1 text-right text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                        name="maximum_adjustment_qty"
                                        value={ maximumQty }
                                        readOnly />
                                </div>
                            </div>
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="result_qty"
                                    className="w-1/3 text-sm font-bold">
                                    Result Qty
                                </label>
                                <input
                                    type="number"
                                    className="p-1 w-32 text-right text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                    name="result_qty"
                                    value={ parseInt(adjustmentQtyEl.current?.value ?? 0) + parseInt((workOrderFG?.order_qty ?? 0) - (workOrderFG?.outstanding_qty ?? 0)) }
                                    readOnly />
                            </div>
                        </div>
                        
                        {
                            (isScanWoSFG || isScanWoFG) ? (
                                <div className="absolute inset-0 flex items-center transition z-10">
                                    <div
                                        className="absolute inset-0 transform transition-all">
                                        <div className="absolute inset-0 bg-black rounded-lg opacity-75"></div>
                                    </div>
                                </div>
                            ) : null
                        }
                    </div>

                    <button
                        className="p-4 bg-green-600 disabled:bg-green-300 rounded-lg"
                        onClick={ () => openConfirmationModal() }
                        disabled={ !workOrderFG.id || !workOrderSFG.id || (!(adjustmentQtyEl.current?.value > 0)) }>
                        <span className="text-xl mr-2">
                            <FontAwesomeIcon icon={ faCheckCircle } />
                        </span> Adjust
                    </button>

                    <button
                        className="p-4 bg-red-600 disabled:bg-red-300 rounded-lg"
                        onClick={ () => resetForm() }
                        disabled={ !(workOrderFG.id || workOrderSFG.id) }>
                            Reset
                    </button>
                        
                    {
                        isShowAdjustmentModal ? (
                            <div className="fixed inset-0 flex items-center transition z-50">
                                <div
                                    className="fixed inset-0 transform transition-all">
                                    <div className="absolute inset-0 bg-black opacity-75"></div>
                                </div>

                                <div className="overflow-hidden transform transition-all mx-auto">
                                    <div className="p-2 bg-gray-100 border border-gray-400 text-black rounded-lg">
                                        {/* Header */}
                                        <div className="mb-2">
                                            <div className="flex-auto flex items-center justify-between">
                                                <span className="text-xs font-extrabold uppercase">
                                                    Adjustment
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={ (e) => closeAdjustmentModal() }
                                                    className="text-xl text-red-600 hover:text-red-300 focus:text-red-900 focus:outline-none">
                                                    <FontAwesomeIcon icon={ faTimesCircle } />
                                                </button>
                                            </div>
                                            <hr className="h-[2px] bg-gray-400 rounded-sm" />
                                        </div>

                                        {/* Body */}
                                        <div className="flex flex-col space-y-6">
                                            <div className="flex items-center justify-center text-4xl">
                                                { inputAdjustmentQty } / { maximumQty }
                                            </div>
                                            
                                            <div className="w-full grid grid-cols-3 gap-2">
                                                {
                                                    ([1, 2, 3, 4, 5, 6, 7, 8, 9]).map((number) => {
                                                        return (
                                                            <button
                                                                key={ `numpad${number}` }
                                                                type="button"
                                                                onClick={ () => handleAdjustmentQtyChangeEvent(`${number}`) }
                                                                className="px-6 py-2 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                                                { number }
                                                            </button>
                                                        );
                                                    })
                                                }
                                                
                                                {/* Clear Button */}
                                                <button
                                                    type="button"
                                                    onClick={ () => clearAdjustmentQtyEvent() }
                                                    className="px-6 py-2 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                                    <FontAwesomeIcon icon={ faArrowLeft }/>
                                                </button>

                                                {/* Zero Number Button */}
                                                <button
                                                    type="button"
                                                    onClick={ () => handleAdjustmentQtyChangeEvent("0") }
                                                    className="px-6 py-2 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                                    0
                                                </button>
                                                
                                                {/* Confirm Button */}
                                                <button
                                                    type="button"
                                                    onClick={ () => confirmAdjustmentQtyEvent() }
                                                    className="px-6 py-2 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                                    <FontAwesomeIcon icon={ faCheck }/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null
                    }
                </div>
            </div>
        </AppLayout>
    )
}
