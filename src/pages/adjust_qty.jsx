import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

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

    // References
    const qrCodeInputEl = useRef(null);
    const adjustmentQtyEl = useRef(0);

    // Hooks
    const WorkOrder = useWorkOrder();

    useEffect(() => {
        if (!workOrderFG?.number || !workOrderSFG.number) {
            document.addEventListener('keypress', handleKeyPressEvent);
        } else {
            document.removeEventListener('keypress', handleKeyPressEvent);
        };

        setIsScanWoFG(!workOrderFG?.number);
        setIsScanWoSFG(!workOrderSFG?.number);
        setScanStatus(!workOrderFG?.number ? 'scan_wo_fg' : (!workOrderSFG?.number ? 'scan_wo_sfg' : 'input_adjustment'));

        return () => {
            document.removeEventListener('keypress', handleKeyPressEvent);
        };
    }, [workOrderFG, workOrderSFG, isScanWoFG, isScanWoSFG]);

    const handleKeyPressEvent = (e) => {
        console.log('keypressed');
        if (e.keyCode !== 13) {
            qrCodeInputEl.current.value += e.key;
        } else {
            console.log(qrCodeInputEl.current.value);
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

        if (parseInt(currentNumbers) > (workOrderSFG?.outstanding_qty ?? 0)) {
            currentNumbers = workOrderSFG?.outstanding_qty ?? 0;
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

    const openConfirmationModal = () => {}

    const resetForm = () => {
        setWorkOrderFG({});
        setWorkOrderSFG({});
    }

    const submitScan = () => {
        const inputValue = qrCodeInputEl.current.value;

        (async () => {
            setIsLoading(true);

            if (!inputValue) {
                throw new Error("Tidak ada data yang diinput.");
            }

            let result;
            let currentWorkOrderFG = workOrderFG, currentWorkOrderSFG = workOrderSFG;

            switch (scanStatus) {
                case 'scan_wo_fg':
                    result = await WorkOrder.findFinishGoodWorkOrder(inputValue);

                    if (result) {
                        setWorkOrderFG(result);

                        currentWorkOrderFG = result;
                    }
                    break;
                case 'scan_wo_sfg':
                    result = await WorkOrder.findSemiFinishGoodWorkOrder(inputValue);

                    if (result) {
                        setWorkOrderSFG(result);

                        currentWorkOrderSFG = result;
                    }
                    break;
                default:
                    break;
            }

            if (!result) {
                throw new Error("Data tidak ditemukan.");
            }

            if (currentWorkOrderFG.id && currentWorkOrderSFG.id && scanStatus !== "input_adjustment") {
                const isCompatiblePart = await WorkOrder.checkCompabilityWorkOrder(currentWorkOrderFG, currentWorkOrderSFG)
                    .catch(error => {
                        setWorkOrderSFG({});
                        throw error;
                    });
                
                if (!isCompatiblePart) {
                    setWorkOrderSFG({});

                    throw new Error("Work order tidak sesuai");
                }
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

        qrCodeInputEl.current.value = '';
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
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="work_order_fg_number"
                                    className="w-1/3 text-sm font-bold">
                                    Number
                                </label>
                                <input
                                    type="text"
                                    className="p-1 w-32 text-sm border border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_fg_number"
                                    value={ workOrderFG?.number || '' }
                                    readOnly />
                            </div>
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="work_order_fg_part_name"
                                    className="w-1/3 text-sm font-bold">
                                    Part Name
                                </label>
                                <input
                                    type="text"
                                    className="p-1 flex-auto text-sm border border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_fg_part_name"
                                    value={ workOrderFG?.partdesc || '' }
                                    readOnly />
                            </div>
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="work_order_fg_order_qty"
                                    className="w-1/3 text-sm font-bold">
                                    WO Qty
                                </label>
                                <input
                                    type="number"
                                    className="p-1 w-32 text-right text-sm border border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_fg_order_qty"
                                    value={ workOrderFG?.order_qty ?? 0 }
                                    readOnly />
                            </div>
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="work_order_fg_outstanding_qty"
                                    className="w-1/3 text-sm font-bold">
                                    Outstanding Qty
                                </label>
                                <input
                                    type="number"
                                    className="p-1 w-32 text-right text-sm border border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_fg_outstanding_qty"
                                    value={ workOrderFG?.outstanding_qty ?? 0 }
                                    readOnly />
                            </div>
                        </div>
                        
                        {
                            isScanWoFG && (
                                <div className="absolute inset-0 flex items-center transition z-10">
                                    <div
                                        className="absolute inset-0 transform transition-all">
                                        <div className="absolute inset-0 bg-black rounded-lg opacity-75"></div>
                                    </div>

                                    <div className="overflow-hidden transform transition-all mx-auto">
                                        <span className="text-white text-xl">
                                            { isScanWoFG && ("Silahkan scan Work Order Finish Good!") }
                                        </span>
                                    </div>
                                </div>
                            )
                        }
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
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="work_order_sfg_number"
                                    className="w-1/3 text-sm font-bold">
                                    Number
                                </label>
                                <input
                                    type="text"
                                    className="p-1 w-32 text-sm border border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_sfg_number"
                                    value={ workOrderSFG?.number || '' }
                                    readOnly />
                            </div>
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="work_order_sfg_part_name"
                                    className="w-1/3 text-sm font-bold">
                                    Part Name
                                </label>
                                <input
                                    type="text"
                                    className="p-1 flex-auto text-sm border border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_sfg_part_name"
                                    value={ workOrderSFG?.partdesc || '' }
                                    readOnly />
                            </div>
                            <div className="flex flex-auto items-center">
                                <label
                                    htmlFor="work_order_sfg_outstanding_qty"
                                    className="w-1/3 text-sm font-bold">
                                    Outstanding Qty
                                </label>
                                <input
                                    type="number"
                                    className="p-1 w-32 text-right text-sm border border-gray-400 rounded-lg focus:outline-none"
                                    name="work_order_sfg_outstanding_qty"
                                    value={ workOrderSFG?.outstanding_qty ?? 0 }
                                    readOnly />
                            </div>
                        </div>
                        
                        {
                            (isScanWoSFG || isScanWoFG) && (
                                <div className="absolute inset-0 flex items-center transition z-10">
                                    <div
                                        className="absolute inset-0 transform transition-all">
                                        <div className="absolute inset-0 bg-black rounded-lg opacity-75"></div>
                                    </div>

                                    <div className="overflow-hidden transform transition-all mx-auto">
                                        <span className="text-white text-xl">
                                            { isScanWoSFG && !isScanWoFG && ("Silahkan scan Work Order Semi Finish Good!") }
                                        </span>
                                    </div>
                                </div>
                            )
                        }
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
                                    htmlFor="adjustment_qty"
                                    className="w-1/3 text-sm font-bold">
                                    Adjustment Qty
                                </label>
                                <div className="w-2/3 flex items-center space-x-2">
                                    <input
                                        ref={ adjustmentQtyEl }
                                        type="number"
                                        className={ "w-3/6 p-1 text-right text-sm rounded-lg focus:outline-none " + (!isScanWoFG && !isScanWoSFG ? 'bg-blue-400 hover:cursor-pointer border-4 border-blue-200' : 'border border-gray-400') }
                                        name="adjustment_qty"
                                        defaultValue={ 0 }
                                        readOnly
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
                                        className="w-3/6 p-1 text-right text-sm border border-gray-400 rounded-lg focus:outline-none"
                                        name="maximum_adjustment_qty"
                                        value={ workOrderSFG?.outstanding_qty ?? 0 }
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
                                    className="p-1 w-32 text-right text-sm border border-gray-400 rounded-lg focus:outline-none"
                                    name="result_qty"
                                    value={ parseInt(adjustmentQtyEl.current?.value ?? 0) + parseInt((workOrderFG?.order_qty ?? 0) - (workOrderFG?.outstanding_qty ?? 0)) }
                                    readOnly />
                            </div>
                        </div>
                        
                        {
                            (isScanWoSFG || isScanWoFG) && (
                                <div className="absolute inset-0 flex items-center transition z-10">
                                    <div
                                        className="absolute inset-0 transform transition-all">
                                        <div className="absolute inset-0 bg-black rounded-lg opacity-75"></div>
                                    </div>
                                </div>
                            )
                        }
                    </div>

                    <button
                        className="p-4 bg-green-600 disabled:bg-green-300 rounded-lg"
                        onClick={ () => openConfirmationModal() }
                        disabled={ !(adjustmentQtyEl.current?.value > 0) }>
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
                        isShowAdjustmentModal && (
                            <div className="fixed inset-0 flex items-center transition z-10">
                                <div
                                    className="absolute inset-0 transform transition-all">
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
                                                { inputAdjustmentQty } / { workOrderSFG?.outstanding_qty ?? 0 }
                                            </div>
                                            
                                            <div className="w-full grid grid-cols-3 gap-5">
                                                {
                                                    ([1, 2, 3, 4, 5, 6, 7, 8, 9]).map((number) => {
                                                        return (
                                                            <button
                                                                key={ `numpad${number}` }
                                                                type="button"
                                                                onClick={ () => handleAdjustmentQtyChangeEvent(`${number}`) }
                                                                className="px-8 py-6 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                                                { number }
                                                            </button>
                                                        );
                                                    })
                                                }
                                                
                                                {/* Clear Button */}
                                                <button
                                                    type="button"
                                                    onClick={ () => clearAdjustmentQtyEvent() }
                                                    className="px-8 py-6 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                                    <FontAwesomeIcon icon={ faArrowLeft }/>
                                                </button>

                                                {/* Zero Number Button */}
                                                <button
                                                    type="button"
                                                    onClick={ () => handleAdjustmentQtyChangeEvent("0") }
                                                    className="px-8 py-6 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                                    0
                                                </button>
                                                
                                                {/* Confirm Button */}
                                                <button
                                                    type="button"
                                                    onClick={ () => confirmAdjustmentQtyEvent() }
                                                    className="px-8 py-6 bg-gray-400 hover:bg-gray-300 focus:bg-gray-600 rounded-xl text-2xl text-center font-semibold focus:outline-none">
                                                    <FontAwesomeIcon icon={ faCheck }/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>

            <input ref={ qrCodeInputEl } type="text" className="bg-transparent" hidden/>
        </AppLayout>
    )
}
