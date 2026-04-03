import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Callback registered with an {@link AsyncDialogController} to receive open
 * requests.  The subscriber is responsible for rendering the dialog with the
 * supplied props and calling `onClose` when the user dismisses it.
 *
 * @template I - Extra input props forwarded to the dialog on open.
 * @template R - The value the dialog resolves with on close.
 */
interface AsyncDialogSubscriber<I extends Record<string, unknown>, R> {
    (props: I & { onClose: (data: R | undefined) => void | Promise<void>; }): void;
}

/**
 * Props injected into a dialog component wrapped by {@link createAsyncDialog}.
 *
 * When `open` is `false` the dialog is hidden and no extra props are present.
 * When `open` is `true` the component receives:
 * - `onClose(data)` — call to dismiss the dialog, resolving the caller's promise.
 * - `openProps`      — the input values passed to `openDialog(…)`.
 *
 * Any props from `P` that overlap with `open`, `onClose`, or `I` are omitted
 * to avoid collisions.
 *
 * @template I - Extra input props forwarded on open.
 * @template R - Resolve value.
 * @template P - Full prop type of the wrapped component.
 */
export type AsyncDialogProps<I extends Record<string, unknown>, R, P extends Record<string, unknown>> =
    Omit<P, 'open' | 'onClose' | keyof I> & (
        { open: false } |
        { open: true, onClose: (data: R | undefined) => void | Promise<void>; openProps: Omit<I, 'open' | 'onClose'> }
    )

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

/**
 * Imperative controller that turns any dialog into a **promise-based** API.
 *
 * Typical flow:
 * 1. A React component subscribes via {@link subscribe} (usually in a
 *    `useEffect`).
 * 2. External code calls {@link openDialog} with input props — the returned
 *    `Promise` suspends until the dialog is dismissed.
 * 3. The subscriber renders the dialog and eventually calls `onClose(result)`,
 *    which resolves the promise with `result` (or `undefined` on cancel).
 *
 * If `R` is itself a `Promise`, the controller automatically unwraps it so the
 * caller always receives the resolved value.
 *
 * @template I - Record of extra input props sent to the dialog on open.
 * @template R - The value (or `Promise`) the dialog resolves with.
 *
 * @example
 * ```ts
 * const dialog = new AsyncDialogController<{ title: string }, boolean>();
 *
 * // In a React component
 * useEffect(() => dialog.subscribe(({ title, onClose }) => {
 *   setProps({ open: true, title, onClose });
 * }), []);
 *
 * // Elsewhere
 * const confirmed = await dialog.openDialog({ title: "Delete?" });
 * ```
 */
export class AsyncDialogController<I extends Record<string, unknown>, R> {
    private subscriber: AsyncDialogSubscriber<I, R> | null = null
    constructor() { }

    /**
     * Register a subscriber that will be invoked when {@link openDialog} is
     * called.  Only **one** subscriber may be active at a time.
     *
     * @returns An unsubscribe function.
     */
    public subscribe(fn: AsyncDialogSubscriber<I, R>): () => void {
        this.subscriber = fn
        return () => {
            this.subscriber = null
        }
    }

    /**
     * Open the dialog with the given input props.
     *
     * @returns A promise that resolves with the dialog's return value, or
     *          `undefined` if the dialog was dismissed without a result.
     *          If `R` is a `Promise<T>`, the outer promise resolves with `T`.
     */
    public openDialog(opts: I): Promise<R extends Promise<infer T> ? (T | undefined) : (R | undefined)> {
        return new Promise<R extends Promise<infer T> ? (T | undefined) : (R | undefined)>((resolve, reject) => {
            this.subscriber?.({
                ...opts,
                onClose: async (data: R | undefined) => {
                    try {
                        const result = await data
                        resolve(result as R extends Promise<infer T> ? (T | undefined) : (R | undefined))
                    } catch (error) {
                        reject(error)
                    }
                }
            })

        })
    }
}

// ---------------------------------------------------------------------------
// createAsyncDialog
// ---------------------------------------------------------------------------

/**
 * Convenience wrapper that pairs an {@link AsyncDialogController} with a React
 * component, managing the open/close state automatically.
 *
 * Returns a `[controller, AsyncDialog]` tuple:
 * - `controller.openDialog(input)` — opens the dialog and returns a `Promise`
 *   that resolves when the user closes it.
 * - `<AsyncDialog />` — render this once; it handles open/close state internally.
 *
 * @template I - Extra input props forwarded on open.
 * @template R - Resolve value.
 * @template P - Full prop type of the inner component.
 *
 * @example
 * ```tsx
 * const [confirmCtrl, ConfirmDialog] = createAsyncDialog(ConfirmDialogContent);
 *
 * // Render the managed dialog once
 * <ConfirmDialog />
 *
 * // Open it imperatively and await the result
 * const ok = await confirmCtrl.openDialog({ title: "Sure?" });
 * ```
 */
export function createAsyncDialog<I extends Record<string, unknown>, R, P extends Record<string, unknown>>(Component: React.ComponentType<AsyncDialogProps<I, R, P>>) {
    const controller = new AsyncDialogController<I, R>()
    function AsyncDialog(props: P) {
        const [openInProps, setOpenInProps] = useState<AsyncDialogProps<I, R, P>>({ open: false })
        useEffect(() => {
            return controller.subscribe(({ onClose, ...opts }) => {
                setOpenInProps({
                    open: true, onClose: (data: R | undefined) => {
                        onClose(data);
                        setOpenInProps({ open: false })
                    }, openProps: opts as Omit<I, 'open' | 'onClose'>
                })
            })
        }, [])
        return <Component {...props} {...openInProps} />
    }
    return [controller, AsyncDialog] as const
}