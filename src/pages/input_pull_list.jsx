import { useEffect, useState, useRef } from "react";
import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// CSS
import 'react-datetime-picker/dist/DateTimePicker.css';

// Components
import AppLayout from "@/components/layouts/AppLayout";
import Navbar from "@/components/layouts/Navbar";

// Modals
import InputGoodQtyModal from "@/components/modals/InputPullList/InputGoodQtyModal";
import InputNgClassificationsModal from "@/components/modals/InputPullList/InputNgClassificationsModal";

// Hooks
import useWorkOrder from "@/hooks/useWorkOrder";

export default function InputPullList() {
    // State
    const [isLoading, setIsLoading] = useState(false);
    const [isScanWoFG, setIsScanWoFG] = useState(false);
    const [isInputDateTimeProduction, setIsInputDateTimeProduction] = useState(false);
    const [isInputProductionQty, setIsInputProductionQty] = useState(false);
    const [isShowGoodQtyModal, setIsShowGoodQtyModal] = useState(false);
    const [isShowNgClassificationModal, setIsShowNgClassificationModal] = useState(false);

    // Props
    const [workOrderFG, setWorkOrderFG] = useState({});
    const [goodQty, setGoodQty] = useState(0);
    const [ngClassificationLists, setNgClassificationLists] = useState([]);
    const [maximumQty, setMaximumQty] = useState(0);

    // References
    const woNumberInputEl = useRef('');
    const dateProductionEl = useRef('');
    const timeProductionEl = useRef('');

    // Hooks
    const WorkOrder = useWorkOrder();

    // Addons
    const FireSwal = withReactContent(Swal);

    // Effect
    useEffect(() => {
        setIsScanWoFG(!workOrderFG?.number);
        setIsInputDateTimeProduction(!(!workOrderFG?.number));
        setIsInputProductionQty(!(!workOrderFG?.number));

        if (workOrderFG.number) {
            (
                async() => {
                    const pullListData = await WorkOrder.getPullListsByWorkOrderNumber(workOrderFG.number);
                    
                    const totalPullListQty = pullListData.reduce((prev, curr) => prev + parseInt(curr.good_qty), 0);

                    setMaximumQty(workOrderFG?.order_qty - totalPullListQty);
                }
            )();
        } else {
            setMaximumQty(0);
        }


        return () => {
        };
    }, [workOrderFG, ngClassificationLists]);

    // Handle onKeyPress workOrderInputEl
    const handleKeyDownWorkOrderInputEl = (e) => {
        if (e?.code === "Enter") {
            submitSearchWorkOrder();
        }
    }

    // Handle search number WO
    const submitSearchWorkOrder = () => {
        const inputValue = woNumberInputEl.current.value;

        (async () => {
            setIsLoading(true);

            if (!inputValue) {
                throw new Error("Tidak ada data yang diinput.");
            }

            let result;

            result = await WorkOrder.findFinishGoodWorkOrder(inputValue);

            if (result) {
                woNumberInputEl.current.value = result.number;
                setWorkOrderFG(result);
            }
        })()
            .catch(err => {
                FireSwal.fire({
                    icon: 'error',
                    title: <strong>Error</strong>,
                    html: <span>{ err.message }</span>,
                    showConfirmButton: false,
                    timer: 3000
                });
                
                woNumberInputEl.current.value = '';

                woNumberInputEl.current.focus();
            })
            .finally(() => setIsLoading(false));
    }

    // Confirmation Modal
    const openConfirmationModal = () => {
        FireSwal.mixin({
            customClass: {
                confirmButton: 'px-6 py-2 bg-green-600 hover:bg-green-400 focus:bg-green-800 disabled:bg-green-300 rounded-lg text-white',
                cancelButton: 'px-6 py-2 bg-red-600 hover:bg-red-400 focus:bg-red-800 disabled:bg-red-300 rounded-lg text-white'
            },
            buttonsStyling: false
        }).fire({
            title: 'Konfirmasi',
            text: "Anda akan melakukan proses input pull list ke ABAS. Data yang sudah terkirim ke ABAS tidak dapat diubah di aplikasi ini. Anda yakin?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya',
            cancelButtonText: 'Tidak'
        }).then((result) => {
            if (result.isConfirmed) {
                submitForm();
            }
        });
    }

    // Reset Form
    const resetForm = () => {
        setWorkOrderFG({});
        setGoodQty(0);
        setNgClassificationLists([]);
        setMaximumQty(0);
    }

    // Submit Form
    const submitForm = () => {
        try {
            // Periksa data WO Finish Good
            if (!workOrderFG.id) throw new Error("Data work order belum ditentukan. Periksa kembali form Anda.");

            // Periksa NG qty
            let totalNgQty = 0;
            if (ngClassificationLists.length > 0) {
                totalNgQty = ngClassificationLists.map(list => {
                    if (parseInt(list.qty) <= 0) throw new Error('Terdapat NG qty yang kurang dari 0');

                    return list.qty;
                }).reduce((prev, cur) => prev + cur);

                if (totalNgQty <= 0) throw new Error('Total NG Quantity harus lebih dari 0');
                if (totalNgQty > (maximumQty - goodQty)) throw new Error(`Total NG Quantity tidak boleh melebihi maksimum. Maximum Quantity : ${(maximumQty - goodQty)}`);
            }

            // Periksa good qty
            if (goodQty > 0) {
                if (goodQty <= 0) {
                    throw new Error("Nilai good qty harus lebih dari 0");
                } else if(goodQty > (maximumQty - totalNgQty)) {
                    throw new Error("Nilai good qty melebihi maksimum");
                }
            }

            // Jumlahkan Qty yang diinput
            const totalAllQty = goodQty + (totalNgQty ?? 0);
            if (totalAllQty <= 0) throw new Error("Salah satu qty yang diinput harus melebihi 0");

            // Proses submit
            (async () => {
                setIsLoading(true);

                if (!workOrderFG.id) {
                    setWorkOrderFG({});
                    throw new Error("Data work order finish good tidak valid. Mohon input kembali data work order finish good.");
                }

                const form = {
                    'work_order' : workOrderFG,
                    'good_qty' : goodQty,
                    'ng_qty' : ngClassificationLists.map((list) => list.qty).reduce((prevVal, curVal) => prevVal + curVal, 0),
                    'production_date' : dateProductionEl.current.value,
                    'production_time' : timeProductionEl.current.value,
                    'ng_classifications' : ngClassificationLists
                };
                
                const processResponse = await WorkOrder.submitPullList(workOrderFG, form);

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

    return (
        <AppLayout
            isLoading={ isLoading }>
            <Navbar/>

            <div className="relative pt-20 m-1 flex flex-col space-y-3">
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
                                ref={ woNumberInputEl }
                                type="text"
                                className="p-1 col-span-4 text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                name="work_order_fg_number"
                                disabled={ !isScanWoFG }
                                onKeyDown={ handleKeyDownWorkOrderInputEl } />
                            <button
                                type="button"
                                className="col-span-1 ml-1 p-1 text-white bg-blue-600 hover:bg-blue-400 disabled:bg-blue-300 border disabled:border-0 border-blue-700 rounded-lg"
                                disabled={ !isScanWoFG }
                                onClick={ () => submitSearchWorkOrder() }>
                                <FontAwesomeIcon icon={ faSearch }/>
                            </button>
                        </div>
                        <div className="grid grid-cols-12 items-center">
                            <label
                                htmlFor="work_order_fg_part_name"
                                className="col-span-4 text-sm font-bold">
                                Part Number
                            </label>
                            <input
                                type="text"
                                className="p-1 col-span-8 text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                name="work_order_fg_part_name"
                                value={ workOrderFG?.partnumber || '' }
                                readOnly />
                        </div>
                        <div className="grid grid-cols-12 items-center">
                            <label
                                htmlFor="work_order_fg_part_name"
                                className="col-span-4 text-sm font-bold">
                                Part Class
                            </label>
                            <input
                                type="text"
                                className="p-1 col-span-8 text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                name="work_order_fg_part_name"
                                value={ workOrderFG?.partclass || '' }
                                readOnly />
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
                    </div>
                </div>
                
                <hr className="h-[2px] bg-gray-400 rounded-sm" />

                {/* Last Date Production Card */}
                <div className="relative p-2 bg-gray-100 border border-gray-400 text-black rounded-lg">
                    {/* Header */}
                    <div className="mb-2">
                        <span className="text-xs font-extrabold uppercase">
                            Tanggal Waktu Produksi
                        </span>
                        <hr className="h-[2px] bg-gray-400 rounded-sm" />
                    </div>

                    {/* Identity */}
                    <div className="flex flex-col space-y-3">
                        {/* Tanggal */}
                        <div className="grid grid-cols-6 gap-3 items-center">
                            <label
                                htmlFor="date_production"
                                className="col-span-2 text-sm font-bold"
                                >
                                Tanggal
                            </label>
                            <input
                                ref={ dateProductionEl }
                                type="date"
                                className="p-1 col-span-2 text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                defaultValue={ (() => {
                                    const date = new Date();

                                    const year = (date.getFullYear()).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
                                    const month = (date.getMonth() + 1).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
                                    const day = (date.getDate()).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

                                    return `${year}-${month}-${day}`;
                                })() }
                                disabled={ !isInputDateTimeProduction }
                                />
                        </div>

                        {/* Waktu */}
                        <div className="grid grid-cols-6 gap-3 items-center">
                            <label
                                htmlFor="time_production"
                                className="col-span-2 text-sm font-bold"
                                >
                                Waktu
                            </label>
                            <input
                                ref={ timeProductionEl }
                                type="time"
                                className="p-1 col-span-2 text-sm bg-blue-200 disabled:bg-gray-300 read-only:bg-gray-300 border-2 disabled:border read-only:border border-blue-400 disabled:border-gray-400 read-only:border-gray-400 rounded-lg focus:outline-none"
                                defaultValue={ (() => {
                                    const date = new Date();

                                    const minute = (date.getMinutes()).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
                                    const hour = (date.getHours()).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

                                    return `${hour}:${minute}`;
                                })() }
                                disabled={ !isInputDateTimeProduction }
                                />
                        </div>
                    </div>
                    
                    {/* {
                        isScanWoFG ? (
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
                        ) : null
                    } */}
                </div>

                {/* Quantity Input */}
                <div className="relative p-2 bg-gray-100 border border-gray-400 text-black rounded-lg">
                    {/* Header */}
                    <div className="mb-2">
                        <span className="text-xs font-extrabold uppercase">
                            Input Quantity Produksi
                        </span>

                        <hr className="h-[2px] bg-gray-400 rounded-sm" />
                    </div>

                    {/* Identity */}
                    <div className="flex flex-col space-y-3">
                        <div className="grid grid-cols-6 items-center">
                            <label htmlFor="good_qty" className="col-span-2 text-sm font-bold">
                                Good Qty
                            </label>
                            <input
                                type="number"
                                name="good_qty"
                                className="p-1 col-span-2 text-right text-sm hover:cursor-pointer disabled:hover:cursor-not-allowed bg-blue-200 disabled:bg-gray-300 border-2 disabled:border border-blue-400 disabled:border-gray-400 rounded-lg focus:outline-none"
                                value={ goodQty }
                                onClick={ () => setIsShowGoodQtyModal(true) }
                                disabled={ !isInputProductionQty }
                                readOnly
                                />
                        </div>
                        <div className="grid grid-cols-6 items-center">
                            <label htmlFor="ng_qty" className="col-span-2 text-sm font-bold">
                                NG Qty
                            </label>
                            <input
                                type="number"
                                name="ng_qty"
                                className="p-1 col-span-2 text-right text-sm hover:cursor-pointer disabled:hover:cursor-not-allowed bg-blue-200 disabled:bg-gray-300 border-2 disabled:border border-blue-400 disabled:border-gray-400 rounded-lg focus:outline-none"
                                value={ parseInt(ngClassificationLists.map((list) => list.qty).reduce((prevVal, curVal) => prevVal + curVal, 0)) }
                                onClick={ () => setIsShowNgClassificationModal(true) }
                                disabled={ !isInputProductionQty }
                                readOnly
                                />
                        </div>
                    </div>
                </div>

                <button
                    className="p-4 bg-green-600 disabled:bg-green-300 rounded-lg"
                    onClick={ () => openConfirmationModal() }
                    disabled={ !(workOrderFG.id) }>
                    <span className="text-xl mr-2">
                        <FontAwesomeIcon icon={ faCheckCircle } />
                    </span> Submit
                </button>

                <button
                    className="p-4 bg-red-600 disabled:bg-red-300 rounded-lg"
                    onClick={ () => resetForm() }
                    disabled={ !(workOrderFG.id) }>
                        Reset
                </button>
            </div>

            {/* Modals */}
            <InputGoodQtyModal showModal={ isShowGoodQtyModal } setShowModal={ setIsShowGoodQtyModal } setQty={ setGoodQty } initialValue={ goodQty } maximumValue={ maximumQty } />
            <InputNgClassificationsModal showModal={ isShowNgClassificationModal } setShowModal={ setIsShowNgClassificationModal } lists={ ngClassificationLists } setLists={ setNgClassificationLists } maximumNumber={ maximumQty - goodQty } />
        </AppLayout>
    );
}