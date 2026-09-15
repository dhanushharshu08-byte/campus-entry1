"""
Background SLA Worker Thread for CampuSentry Helpdesk.
Periodically scans active tickets to evaluate SLA countdowns,
trigger escalations, update overdue statuses, and emit alerts.
"""
import time
import threading
import logging
from services.sla_service import evaluate_all_active_slas

logger = logging.getLogger('SLAWorker')

_sla_thread = None
_stop_event = threading.Event()

def _worker_loop(app, interval_seconds=45):
    """Loop that runs inside a daemon thread."""
    logger.info(f"Started background SLA evaluation monitor (Interval: {interval_seconds}s)")
    while not _stop_event.is_set():
        try:
            with app.app_context():
                evaluate_all_active_slas()
        except Exception as e:
            logger.error(f"Error in evaluation loop: {e}")

        # Sleep in short increments to allow rapid clean shutdown
        for _ in range(interval_seconds):
            if _stop_event.is_set():
                break
            time.sleep(1)

def start_sla_worker(app, interval_seconds=45):
    """Starts the background worker thread if not already running."""
    global _sla_thread
    if _sla_thread is None or not _sla_thread.is_alive():
        _stop_event.clear()
        _sla_thread = threading.Thread(
            target=_worker_loop,
            args=(app, interval_seconds),
            daemon=True,
            name="SLA_Worker_Thread"
        )
        _sla_thread.start()
        return True
    return False

def stop_sla_worker():
    """Stops the background worker gracefully."""
    global _stop_event
    _stop_event.set()
