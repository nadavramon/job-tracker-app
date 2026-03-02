import { render } from '@testing-library/react';
import ApiInterceptorSetup from '@/components/layout/ApiInterceptorSetup';
import { injectToast } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

jest.mock('@/lib/api', () => ({
    injectToast: jest.fn(),
    default: { interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } },
}));

jest.mock('@/context/ToastContext', () => ({
    useToast: jest.fn(),
}));

const mockToast = {
    error: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
};

describe('ApiInterceptorSetup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    });

    it('calls injectToast with a function on mount', () => {
        render(<ApiInterceptorSetup />);
        expect(injectToast).toHaveBeenCalledWith(expect.any(Function));
    });

    it('renders nothing', () => {
        const { container } = render(<ApiInterceptorSetup />);
        expect(container).toBeEmptyDOMElement();
    });

    it('clears the injected toast on unmount', () => {
        const { unmount } = render(<ApiInterceptorSetup />);
        unmount();
        expect(injectToast).toHaveBeenLastCalledWith(null);
    });

    it('injected function calls toast.error for error type', () => {
        render(<ApiInterceptorSetup />);
        const injected = (injectToast as jest.Mock).mock.calls[0][0] as (type: string, msg: string) => void;
        injected('error', 'Something went wrong');
        expect(mockToast.error).toHaveBeenCalledWith('Something went wrong');
    });

    it('injected function calls toast.warning for warning type', () => {
        render(<ApiInterceptorSetup />);
        const injected = (injectToast as jest.Mock).mock.calls[0][0] as (type: string, msg: string) => void;
        injected('warning', 'Watch out');
        expect(mockToast.warning).toHaveBeenCalledWith('Watch out');
    });
});
